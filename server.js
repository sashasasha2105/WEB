// File: server.js

require('dotenv').config();
const express = require('express');
const path = require('path');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const CDEK_HOST = process.env.CDEK_HOST;
const CDEK_BASE = process.env.CDEK_API_BASE;
const Y_SUG_KEY = process.env.YANDEX_SUGGEST_KEY;

// YooKassa
const YOO_SHOP_ID = process.env.YOO_KASSA_SHOP_ID;
const YOO_SECRET_KEY = process.env.YOO_KASSA_SECRET_KEY;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Временное хранилище заказов (в продакшене используйте БД)
const pendingOrders = new Map(); // paymentId -> orderData
const completedOrders = new Map(); // orderId -> fullOrderInfo

// Отдаём клиенту ключи для Яндекс.Карт / Suggest
app.get('/config.js', (_, res) => {
    console.log('[Server] Запрошен /config.js');
    res.type('application/javascript').send(`
    window.__ENV = {
      YANDEX_JSAPI_KEY: "${process.env.YANDEX_JSAPI_KEY}",
      YANDEX_SUGGEST_KEY: "${Y_SUG_KEY}"
    };
  `);
});

// =========================================
// ====  CDEK OAuth: кешируем токен      ====
// =========================================
let cdekToken = null;
let cdekExp = 0;

async function getCdekToken() {
    if (cdekToken && Date.now() < cdekExp) {
        return cdekToken;
    }
    console.log('[getCdekToken] Запрашиваем новый токен CDEK...');
    const resp = await fetch(`${CDEK_HOST}/v2/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: process.env.CDEK_CLIENT_ID,
            client_secret: process.env.CDEK_CLIENT_SECRET
        })
    });
    if (!resp.ok) {
        console.error('[getCdekToken] Ошибка при получении токена:', resp.status, await resp.text());
        throw new Error('CDEK OAuth failed');
    }
    const json = await resp.json();
    cdekToken = json.access_token;
    cdekExp = Date.now() + json.expires_in * 1000 - 5000;
    console.log('[getCdekToken] Токен получен, expires_in =', json.expires_in);
    return cdekToken;
}

// ==================================================
// ====  Прокси для Яндекс.Suggest (autocomplete) ====
// ==================================================
app.get('/api/yandex/suggest', async (req, res) => {
    const text = (req.query.text || '').trim();
    if (!text) return res.status(400).json({ error: 'missing text' });
    console.log('[API /api/yandex/suggest] Запрашиваем подсказки Yandex для:', text);

    if (!Y_SUG_KEY) {
        console.error('[API /api/yandex/suggest] YANDEX_SUGGEST_KEY не задан');
        return res.status(500).json({ error: 'suggest failed' });
    }

    const url = `https://suggest-maps.yandex.ru/v1/suggest?apikey=${encodeURIComponent(Y_SUG_KEY)}` +
        `&text=${encodeURIComponent(text)}&lang=ru_RU&results=7`;
    try {
        const r = await fetch(url);
        const body = await r.text();
        let json;
        try { json = body ? JSON.parse(body) : { results: [] }; }
        catch { json = { results: [] }; }
        console.log('[API /api/yandex/suggest] Ответ от Яндекс:', json);
        return res.json(json);
    } catch (e) {
        console.error('[API /api/yandex/suggest] Ошибка fetch:', e);
        return res.status(500).json({ error: 'suggest failed' });
    }
});

// =======================================================
// ====  Прокси для поиска городов через CDEK (v2)     ====
// =======================================================
app.get('/api/cdek/cities', async (req, res) => {
    const q = (req.query.search || '').trim();
    if (!q) return res.status(400).json({ error: 'missing search' });
    console.log('[API /api/cdek/cities] Поиск городов CDEK для:', q);

    try {
        const tok = await getCdekToken();
        const r = await fetch(
            `${CDEK_BASE}/v2/location/suggest/cities?limit=10&name=${encodeURIComponent(q)}`,
            { headers: { Authorization: `Bearer ${tok}` } }
        );
        const text = await r.text();
        let json;
        try { json = text ? JSON.parse(text) : []; }
        catch { json = []; }
        console.log('[API /api/cdek/cities] Ответ от CDEK:', json);
        return res.status(r.status).json(json);
    } catch (e) {
        console.error('[API /api/cdek/cities] Ошибка:', e);
        return res.status(500).json({ error: 'cdek cities failed' });
    }
});

// =========================================================
// ====  Прокси для получения ПВЗ/постаматов у CDEK (v2) ====
// =========================================================
app.get('/api/cdek/pvz', async (req, res) => {
    const cityCode = req.query.cityId;
    const page = req.query.page || 0;
    if (!cityCode) return res.status(400).json({ error: 'missing cityId' });
    console.log(`[API /api/cdek/pvz] Запрос ПВЗ: cityId=${cityCode}, page=${page}`);

    try {
        const tok = await getCdekToken();
        const url = `${CDEK_BASE}/v2/deliverypoints?city_code=${encodeURIComponent(cityCode)}` +
            `&type=ALL&size=1000&page=${page}`;
        const r = await fetch(url, {
            headers: { Authorization: `Bearer ${tok}`, Accept: 'application/json' }
        });
        const text = await r.text();
        let json;
        try { json = text ? JSON.parse(text) : []; }
        catch { json = []; }
        const totalPagesHeader = r.headers.get('x-total-pages') || '1';
        res.set('x-total-pages', totalPagesHeader);
        console.log('[API /api/cdek/pvz] Ответ от CDEK (количество):', Array.isArray(json) ? json.length : 0);
        return res.status(200).json(json);
    } catch (e) {
        console.error('[API /api/cdek/pvz] Ошибка:', e);
        return res.status(500).json({ error: 'cdek pvz failed' });
    }
});

// =========================================================
// ====  Прокси для калькулятора тарифов CDEK (v2)       ====
// =========================================================
app.post('/api/cdek/calculator/tariff', async (req, res) => {
    console.log('[API /api/cdek/calculator/tariff] Тело запроса:', req.body);
    try {
        const tok = await getCdekToken();
        const r = await fetch(`${CDEK_BASE}/v2/calculator/tariff`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${tok}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const json = await r.json();
        console.log('[API /api/cdek/calculator/tariff] Ответ от CDEK:', json);
        return res.status(r.status).json(json);
    } catch (e) {
        console.error('[API /api/cdek/calculator/tariff] Ошибка:', e);
        return res.status(500).json({ error: 'cdek tariff failed' });
    }
});

// =========================================================
// ====  СОЗДАНИЕ ЗАКАЗА В CDEK (v2) - теперь внутренняя функция ====
// =========================================================
async function createCdekOrder(orderData) {
    console.log('[createCdekOrder] Создание заказа в CDEK');
    console.log('[createCdekOrder] Данные заказа:', JSON.stringify(orderData, null, 2));

    try {
        const token = await getCdekToken();

        // Добавляем обязательные поля для отправителя
        if (!orderData.sender) {
            orderData.sender = {
                company: 'ИП clip & go',
                name: 'Менеджер магазина',
                email: 'clip_and_go@outlook.com',
                phones: [{ number: '+79999999999' }]
            };
        }

        if (!orderData.number) {
            orderData.number = `CG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }

        if (!orderData.comment) {
            orderData.comment = 'Заказ с сайта clip & go';
        }

        if (!orderData.from_location) {
            orderData.from_location = {
                code: 44,
                city: 'Москва',
                address: 'Склад интернет-магазина'
            };
        }

        if (orderData.packages && orderData.packages.length > 0) {
            orderData.packages = orderData.packages.map((pkg, index) => ({
                ...pkg,
                number: pkg.number || `PKG-${index + 1}`,
                comment: pkg.comment || 'Товары clip & go',
                length: pkg.length || 20,
                width: pkg.width || 15,
                height: pkg.height || 10,
                weight: pkg.weight || 500
            }));
        }

        console.log('[createCdekOrder] Отправляем заказ в CDEK:', JSON.stringify(orderData, null, 2));

        const response = await fetch(`${CDEK_BASE}/v2/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const responseText = await response.text();
        let result;

        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('[createCdekOrder] Не удалось распарсить ответ:', responseText);
            throw new Error('Некорректный ответ от CDEK');
        }

        console.log('[createCdekOrder] Ответ от CDEK:', JSON.stringify(result, null, 2));

        if (response.ok && result.entity) {
            console.log('[createCdekOrder] Заказ успешно создан! UUID:', result.entity.uuid);
            return {
                success: true,
                order_uuid: result.entity.uuid,
                order_number: orderData.number,
                cdek_response: result
            };
        }

        if (result.errors && result.errors.length > 0) {
            console.error('[createCdekOrder] Ошибки от CDEK:', result.errors);
            const errorMessages = result.errors.map(err =>
                `${err.message || err.code} (код: ${err.code})`
            ).join('; ');
            throw new Error(`Ошибка CDEK: ${errorMessages}`);
        }

        throw new Error(`Неожиданный ответ от CDEK: ${response.status}`);

    } catch (error) {
        console.error('[createCdekOrder] Ошибка:', error);
        throw error;
    }
}

// =============================================================
// ====  Создание платежа YooKassa (теперь сохраняем заказ)    ====
// =============================================================
app.post('/api/yookassa/create-payment', async (req, res) => {
    const { amount, currency, description, orderData } = req.body;
    if (typeof amount !== 'number' || !currency) {
        return res.status(400).json({ error: 'Missing amount or currency' });
    }
    if (!YOO_SHOP_ID || !YOO_SECRET_KEY) {
        console.error('[API /api/yookassa/create-payment] Параметры YOO_KASSA не заданы.');
        return res.status(500).json({ error: 'yookassa credentials missing' });
    }

    console.log('[API /api/yookassa/create-payment] amount=', amount, 'currency=', currency);

    const auth = Buffer.from(`${YOO_SHOP_ID}:${YOO_SECRET_KEY}`).toString('base64');
    const idemKey = randomUUID();

    const paymentRequest = {
        amount: {
            value: amount.toFixed(2),
            currency: currency
        },
        confirmation: {
            type: 'redirect',
            return_url: `http://localhost:${PORT}/payment/payment-result.html`
        },
        capture: true,
        description: description || 'Оплата заказа clip & go',
        metadata: {
            order_source: 'clip_and_go_website'
        }
    };

    try {
        const response = await fetch('https://api.yookassa.ru/v3/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`,
                'Idempotence-Key': idemKey
            },
            body: JSON.stringify(paymentRequest)
        });
        const payment = await response.json();

        if (!response.ok) {
            console.error('[API /api/yookassa/create-payment] Ошибка от YooKassa:', payment);
            return res.status(response.status).json(payment);
        }

        const confirmationUrl = payment.confirmation && payment.confirmation.confirmation_url;
        console.log('[API /api/yookassa/create-payment] confirmation_url =', confirmationUrl);

        if (!confirmationUrl) {
            return res.status(500).json({ error: 'confirmation_url missing in YooKassa response' });
        }

        // Сохраняем данные заказа для последующей обработки после оплаты
        if (orderData) {
            pendingOrders.set(payment.id, {
                ...orderData,
                paymentId: payment.id,
                createdAt: new Date().toISOString(),
                amount: amount
            });
            console.log('[API /api/yookassa/create-payment] Заказ сохранен для обработки после оплаты');
        }

        return res.json({
            confirmation_url: confirmationUrl,
            payment_id: payment.id
        });
    } catch (err) {
        console.error('[API /api/yookassa/create-payment] Ошибка:', err);
        return res.status(500).json({ error: 'yookassa create payment failed' });
    }
});

// =============================================================
// ====  Вебхук для обработки уведомлений от YooKassa          ====
// =============================================================
app.post('/api/payment/webhook', async (req, res) => {
    console.log('[Webhook] Получено уведомление от YooKassa:', JSON.stringify(req.body, null, 2));

    const { type, event, object: payment } = req.body;

    // YooKassa может отправлять разные форматы уведомлений
    const isPaymentSucceeded =
        (type === 'payment.succeeded' && payment && payment.status === 'succeeded') ||
        (event === 'payment.succeeded' && payment && payment.status === 'succeeded');

    if (isPaymentSucceeded) {
        console.log('[Webhook] Платеж успешен! ID:', payment.id);

        // Находим соответствующий заказ
        const orderData = pendingOrders.get(payment.id);
        if (!orderData) {
            console.log('[Webhook] Заказ для платежа не найден:', payment.id);
            console.log('[Webhook] Доступные платежи:', Array.from(pendingOrders.keys()));
            return res.status(200).send('OK');
        }

        try {
            // Создаем заказ в CDEK ТОЛЬКО после успешной оплаты
            console.log('[Webhook] Создаем заказ в CDEK для оплаченного платежа...');
            const cdekResult = await createCdekOrder(orderData);

            // Сохраняем информацию о завершенном заказе
            const completedOrder = {
                id: `ORDER_${Date.now()}`,
                paymentId: payment.id,
                cdekUuid: cdekResult.order_uuid,
                cdekNumber: cdekResult.order_number,
                amount: orderData.amount,
                items: orderData.packages?.[0]?.items || [],
                recipient: orderData.recipient,
                delivery: {
                    type: orderData.delivery_point ? 'ПВЗ' : 'Курьер',
                    address: orderData.delivery_point || orderData.to_location?.address,
                    tariff: orderData.tariff_code
                },
                status: 'created',
                createdAt: orderData.createdAt,
                paidAt: new Date().toISOString()
            };

            completedOrders.set(completedOrder.id, completedOrder);
            pendingOrders.delete(payment.id);

            console.log('[Webhook] Заказ успешно создан в CDEK:', cdekResult.order_uuid);
            console.log('[Webhook] Заказ сохранен с ID:', completedOrder.id);
            console.log('[Webhook] Общее количество завершенных заказов:', completedOrders.size);

        } catch (error) {
            console.error('[Webhook] Ошибка создания заказа в CDEK:', error);
            // Даже если заказ в CDEK не создался, сохраняем информацию об оплаченном заказе
            const failedOrder = {
                id: `ORDER_${Date.now()}`,
                paymentId: payment.id,
                amount: orderData.amount,
                status: 'payment_success_cdek_failed',
                error: error.message,
                createdAt: orderData.createdAt,
                paidAt: new Date().toISOString(),
                orderData: orderData
            };
            completedOrders.set(failedOrder.id, failedOrder);
            pendingOrders.delete(payment.id);

            console.log('[Webhook] Заказ сохранен как failed с ID:', failedOrder.id);
            console.log('[Webhook] Общее количество завершенных заказов:', completedOrders.size);
        }
    } else {
        console.log('[Webhook] Неизвестный тип уведомления или статус:', { type, event, status: payment?.status });
    }

    res.status(200).send('OK');
});

// =============================================================
// ====  API для получения заказов пользователя               ====
// =============================================================
app.get('/api/orders', (req, res) => {
    // В будущем здесь будет фильтрация по пользователю
    // Пока возвращаем все заказы
    const orders = Array.from(completedOrders.values()).sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    console.log('[API /api/orders] Возвращаем заказы:', orders.length);
    console.log('[API /api/orders] Pending заказов:', pendingOrders.size);
    console.log('[API /api/orders] Completed заказов:', completedOrders.size);

    if (orders.length > 0) {
        console.log('[API /api/orders] Пример заказа:', {
            id: orders[0].id,
            status: orders[0].status,
            amount: orders[0].amount
        });
    }

    res.json(orders);
});

// =============================================================
// ====  API для получения конкретного заказа                 ====
// =============================================================
app.get('/api/orders/:orderId', (req, res) => {
    const order = completedOrders.get(req.params.orderId);
    if (!order) {
        return res.status(404).json({ error: 'Заказ не найден' });
    }
    res.json(order);
});

// Запускаем сервер
app.listen(PORT, () => {
    console.log(`🚀 Server запущен на http://localhost:${PORT}`);
    console.log(`📦 Вебхук YooKassa: https://e50b-2a0c-16c0-500-296-216-3cff-fea6-ec20.ngrok-free.app/api/payment/webhook`);
    console.log(`📋 API заказов: http://localhost:${PORT}/api/orders`);
    console.log(`👤 Профиль: http://localhost:${PORT}/profile/profile.html`);
});