// File: server.js - ИСПРАВЛЕННАЯ ВЕРСИЯ ДЛЯ ТЕСТОВОГО API СДЭК

require('dotenv').config();
const express = require('express');
const path = require('path');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Читаем настройки из .env
const CDEK_HOST = process.env.CDEK_HOST || 'https://api.edu.cdek.ru';
const CDEK_BASE = process.env.CDEK_API_BASE || 'https://api.edu.cdek.ru';
const Y_SUG_KEY = process.env.YANDEX_SUGGEST_KEY;

// YooKassa
const YOO_SHOP_ID = process.env.YOO_KASSA_SHOP_ID;
const YOO_SECRET_KEY = process.env.YOO_KASSA_SECRET_KEY;

console.log('[Server] Конфигурация:');
console.log('- CDEK API:', CDEK_BASE);
console.log('- CDEK Client ID:', process.env.CDEK_CLIENT_ID ? 'установлен' : 'НЕ УСТАНОВЛЕН');
console.log('- YooKassa Shop ID:', YOO_SHOP_ID ? 'установлен' : 'НЕ УСТАНОВЛЕН');
console.log('- Yandex Suggest Key:', Y_SUG_KEY ? 'установлен' : 'НЕ УСТАНОВЛЕН');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Временное хранилище заказов
const pendingOrders = new Map();
const completedOrders = new Map();

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
        console.log('[getCdekToken] Используем кешированный токен');
        return cdekToken;
    }

    console.log('[getCdekToken] Запрашиваем новый токен CDEK...');
    console.log('[getCdekToken] URL:', `${CDEK_HOST}/v2/oauth/token`);
    console.log('[getCdekToken] Client ID:', process.env.CDEK_CLIENT_ID);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('[getCdekToken] Прерывание по таймауту');
            controller.abort();
        }, 15000);

        const resp = await fetch(`${CDEK_HOST}/v2/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'ClipAndGo/1.0'
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: process.env.CDEK_CLIENT_ID,
                client_secret: process.env.CDEK_CLIENT_SECRET
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('[getCdekToken] Статус ответа:', resp.status);

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error('[getCdekToken] Ошибка HTTP:', resp.status, errorText);
            throw new Error(`CDEK OAuth failed: ${resp.status} - ${errorText}`);
        }

        const json = await resp.json();
        console.log('[getCdekToken] Получен токен, expires_in:', json.expires_in);

        cdekToken = json.access_token;
        cdekExp = Date.now() + (json.expires_in - 300) * 1000; // -5 минут запас

        return cdekToken;

    } catch (error) {
        console.error('[getCdekToken] Ошибка:', error.message);

        // Сбрасываем кеш при ошибке
        cdekToken = null;
        cdekExp = 0;

        if (error.name === 'AbortError') {
            throw new Error('Тайм-аут подключения к СДЭК API');
        }

        throw new Error(`Ошибка получения токена СДЭК: ${error.message}`);
    }
}

// ==================================================
// ====  Прокси для Яндекс.Suggest                ====
// ==================================================
app.get('/api/yandex/suggest', async (req, res) => {
    const text = (req.query.text || '').trim();
    if (!text) return res.status(400).json({ error: 'missing text' });

    console.log('[API /api/yandex/suggest] Запрос для:', text);

    if (!Y_SUG_KEY) {
        console.error('[API /api/yandex/suggest] YANDEX_SUGGEST_KEY не задан');
        return res.status(500).json({ error: 'suggest service not configured' });
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const url = `https://suggest-maps.yandex.ru/v1/suggest?apikey=${encodeURIComponent(Y_SUG_KEY)}` +
            `&text=${encodeURIComponent(text)}&lang=ru_RU&results=7`;

        const r = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        const body = await r.text();
        let json;
        try {
            json = body ? JSON.parse(body) : { results: [] };
        } catch {
            json = { results: [] };
        }

        console.log('[API /api/yandex/suggest] Найдено результатов:', json.results?.length || 0);
        return res.json(json);

    } catch (e) {
        console.error('[API /api/yandex/suggest] Ошибка:', e.message);
        return res.status(500).json({ error: 'suggest failed', details: e.message });
    }
});

// =======================================================
// ====  Поиск городов через CDEK (ИСПРАВЛЕНО!)        ====
// =======================================================
app.get('/api/cdek/cities', async (req, res) => {
    const q = (req.query.search || '').trim();
    if (!q) return res.status(400).json({ error: 'missing search parameter' });

    console.log('[API /api/cdek/cities] Поиск городов CDEK для:', q);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('[API /api/cdek/cities] Таймаут запроса');
            controller.abort();
        }, 15000);

        const tok = await getCdekToken();
        console.log('[API /api/cdek/cities] Токен получен, делаем запрос...');

        // ИСПРАВЛЕНО: правильный endpoint для поиска городов
        const url = `${CDEK_BASE}/v2/location/suggest/cities?name=${encodeURIComponent(q)}&limit=10`;
        console.log('[API /api/cdek/cities] URL запроса:', url);

        const r = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${tok}`,
                'Content-Type': 'application/json',
                'User-Agent': 'ClipAndGo/1.0'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('[API /api/cdek/cities] Статус ответа CDEK:', r.status);

        if (!r.ok) {
            const errorText = await r.text();
            console.error('[API /api/cdek/cities] Ошибка CDEK API:', r.status, errorText);

            // Возвращаем пустой массив для некритичных ошибок
            if (r.status === 404 || r.status === 400 || r.status === 422) {
                console.log('[API /api/cdek/cities] Возвращаем пустой результат для ошибки', r.status);
                return res.status(200).json([]);
            }

            return res.status(r.status).json({ error: 'CDEK API error', details: errorText });
        }

        const text = await r.text();
        let json;
        try {
            json = text ? JSON.parse(text) : [];
        } catch (parseError) {
            console.error('[API /api/cdek/cities] Ошибка парсинга JSON:', parseError.message);
            json = [];
        }

        console.log('[API /api/cdek/cities] Найдено городов:', Array.isArray(json) ? json.length : 0);

        return res.status(200).json(json);

    } catch (e) {
        console.error('[API /api/cdek/cities] Общая ошибка:', e.message);

        if (e.name === 'AbortError') {
            return res.status(408).json({ error: 'request timeout' });
        }

        return res.status(500).json({ error: 'cities search failed', details: e.message });
    }
});

// =========================================================
// ====  Получение ПВЗ/постаматов у CDEK               ====
// =========================================================
app.get('/api/cdek/pvz', async (req, res) => {
    const cityCode = req.query.cityId;
    const page = parseInt(req.query.page || '0', 10);
    const size = parseInt(req.query.size || '1000', 10);

    if (!cityCode) {
        return res.status(400).json({ error: 'missing cityId parameter' });
    }

    console.log(`[API /api/cdek/pvz] Запрос ПВЗ: cityId=${cityCode}, page=${page}, size=${size}`);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('[API /api/cdek/pvz] Таймаут запроса ПВЗ');
            controller.abort();
        }, 20000);

        const tok = await getCdekToken();
        const url = `${CDEK_BASE}/v2/deliverypoints?city_code=${encodeURIComponent(cityCode)}` +
            `&type=ALL&size=${size}&page=${page}`;

        console.log('[API /api/cdek/pvz] URL запроса:', url);

        const r = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${tok}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'ClipAndGo/1.0'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('[API /api/cdek/pvz] Статус ответа:', r.status);

        if (!r.ok) {
            const errorText = await r.text();
            console.error('[API /api/cdek/pvz] Ошибка CDEK API:', r.status, errorText);

            // Устанавливаем заголовки и возвращаем пустой массив
            res.set('x-total-pages', '1');
            return res.status(200).json([]);
        }

        const text = await r.text();
        let json;
        try {
            json = text ? JSON.parse(text) : [];
        } catch {
            json = [];
        }

        const totalPagesHeader = r.headers.get('x-total-pages') || '1';
        res.set('x-total-pages', totalPagesHeader);

        console.log('[API /api/cdek/pvz] Найдено ПВЗ:', Array.isArray(json) ? json.length : 0);
        return res.status(200).json(json);

    } catch (e) {
        console.error('[API /api/cdek/pvz] Ошибка:', e.message);

        res.set('x-total-pages', '1');

        if (e.name === 'AbortError') {
            return res.status(408).json({ error: 'request timeout', results: [] });
        }

        return res.status(500).json({ error: 'pvz search failed', results: [] });
    }
});

// =========================================================
// ====  Калькулятор тарифов CDEK                      ====
// =========================================================
app.post('/api/cdek/calculator/tariff', async (req, res) => {
    console.log('[API /api/cdek/calculator/tariff] Запрос тарифа:', req.body.tariff_code);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('[API /api/cdek/calculator/tariff] Таймаут');
            controller.abort();
        }, 15000);

        const tok = await getCdekToken();

        console.log('[API /api/cdek/calculator/tariff] Отправляем запрос к CDEK...');

        const r = await fetch(`${CDEK_BASE}/v2/calculator/tariff`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tok}`,
                'Content-Type': 'application/json',
                'User-Agent': 'ClipAndGo/1.0'
            },
            body: JSON.stringify(req.body),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('[API /api/cdek/calculator/tariff] Статус ответа:', r.status);

        const text = await r.text();
        let json;
        try {
            json = JSON.parse(text);
        } catch (parseError) {
            console.error('[API /api/cdek/calculator/tariff] Ошибка парсинга:', parseError.message);
            json = { errors: [{ code: 'PARSE_ERROR', message: 'Ошибка обработки ответа' }] };
        }

        if (!r.ok) {
            console.error('[API /api/cdek/calculator/tariff] Ошибка CDEK:', r.status, json);
        } else {
            console.log('[API /api/cdek/calculator/tariff] Успешный расчет тарифа:', req.body.tariff_code,
                '- стоимость:', json.delivery_sum || json.total_sum, 'руб');
        }

        return res.status(r.status).json(json);

    } catch (e) {
        console.error('[API /api/cdek/calculator/tariff] Ошибка:', e.message);

        if (e.name === 'AbortError') {
            return res.status(408).json({
                errors: [{ code: 'TIMEOUT', message: 'Превышено время ожидания' }]
            });
        }

        return res.status(500).json({
            errors: [{ code: 'CALCULATION_FAILED', message: 'Ошибка расчета доставки' }]
        });
    }
});

// =========================================================
// ====  СОЗДАНИЕ ЗАКАЗА В CDEK                        ====
// =========================================================
async function createCdekOrder(orderData) {
    console.log('[createCdekOrder] Создание заказа в CDEK');
    console.log('[createCdekOrder] Номер заказа:', orderData.number);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('[createCdekOrder] Таймаут создания заказа');
            controller.abort();
        }, 30000);

        const token = await getCdekToken();

        // Дополняем обязательными полями
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

        // Валидируем посылки
        if (orderData.packages && orderData.packages.length > 0) {
            orderData.packages = orderData.packages.map((pkg, index) => ({
                ...pkg,
                number: pkg.number || `PKG-${index + 1}`,
                comment: pkg.comment || 'Товары clip & go',
                length: Math.max(pkg.length || 20, 1),
                width: Math.max(pkg.width || 15, 1),
                height: Math.max(pkg.height || 10, 1),
                weight: Math.max(pkg.weight || 500, 100)
            }));
        }

        console.log('[createCdekOrder] Отправляем заказ...');

        const response = await fetch(`${CDEK_BASE}/v2/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'ClipAndGo/1.0'
            },
            body: JSON.stringify(orderData),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('[createCdekOrder] Статус ответа:', response.status);

        const responseText = await response.text();
        let result;

        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('[createCdekOrder] Ошибка парсинга ответа:', responseText);
            throw new Error('Некорректный ответ от службы доставки');
        }

        if (response.ok && result.entity) {
            console.log('[createCdekOrder] Заказ создан успешно! UUID:', result.entity.uuid);
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
            throw new Error(`Ошибка службы доставки: ${errorMessages}`);
        }

        throw new Error(`Неожиданный ответ от службы доставки: ${response.status}`);

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('[createCdekOrder] Таймаут запроса');
            throw new Error('Превышено время ожидания ответа от службы доставки');
        }

        console.error('[createCdekOrder] Ошибка:', error.message);
        throw error;
    }
}

// =============================================================
// ====  YooKassa создание платежа                         ====
// =============================================================
app.post('/api/yookassa/create-payment', async (req, res) => {
    const { amount, currency, description, orderData } = req.body;

    if (typeof amount !== 'number' || !currency) {
        return res.status(400).json({ error: 'Missing amount or currency' });
    }

    if (!YOO_SHOP_ID || !YOO_SECRET_KEY) {
        console.error('[API /api/yookassa/create-payment] Параметры YOO_KASSA не заданы');
        return res.status(500).json({ error: 'payment service not configured' });
    }

    console.log('[API /api/yookassa/create-payment] Создание платежа на сумму:', amount, currency);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const auth = Buffer.from(`${YOO_SHOP_ID}:${YOO_SECRET_KEY}`).toString('base64');
        const idemKey = randomUUID();

        const paymentRequest = {
            amount: {
                value: amount.toFixed(2),
                currency: currency
            },
            confirmation: {
                type: 'redirect',
                return_url: `${process.env.PROTOCOL || 'http'}://${process.env.DOMAIN || 'localhost:3000'}/payment/payment-result.html`
            },
            capture: true,
            description: description || 'Оплата заказа clip & go',
            metadata: {
                order_source: 'clip_and_go_website'
            }
        };

        const response = await fetch('https://api.yookassa.ru/v3/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`,
                'Idempotence-Key': idemKey
            },
            body: JSON.stringify(paymentRequest),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const payment = await response.json();

        if (!response.ok) {
            console.error('[API /api/yookassa/create-payment] Ошибка YooKassa:', response.status, payment);
            return res.status(response.status).json({ error: 'payment creation failed', details: payment });
        }

        const confirmationUrl = payment.confirmation && payment.confirmation.confirmation_url;

        if (!confirmationUrl) {
            console.error('[API /api/yookassa/create-payment] Отсутствует confirmation_url');
            return res.status(500).json({ error: 'invalid payment response' });
        }

        // Сохраняем данные заказа
        if (orderData) {
            pendingOrders.set(payment.id, {
                ...orderData,
                paymentId: payment.id,
                createdAt: new Date().toISOString(),
                amount: amount
            });
            console.log('[API /api/yookassa/create-payment] Заказ сохранен, ID:', payment.id);
        }

        console.log('[API /api/yookassa/create-payment] Платеж создан, ID:', payment.id);

        return res.json({
            confirmation_url: confirmationUrl,
            payment_id: payment.id
        });

    } catch (err) {
        if (err.name === 'AbortError') {
            console.error('[API /api/yookassa/create-payment] Таймаут');
            return res.status(500).json({ error: 'payment service timeout' });
        }

        console.error('[API /api/yookassa/create-payment] Ошибка:', err.message);
        return res.status(500).json({ error: 'payment creation failed', details: err.message });
    }
});

// =============================================================
// ====  Вебхук YooKassa                                   ====
// =============================================================
app.post('/api/payment/webhook', async (req, res) => {
    console.log('[Webhook] Получено уведомление от YooKassa');

    const { type, event, object: payment } = req.body;

    const isPaymentSucceeded =
        (type === 'payment.succeeded' && payment && payment.status === 'succeeded') ||
        (event === 'payment.succeeded' && payment && payment.status === 'succeeded');

    if (isPaymentSucceeded) {
        console.log('[Webhook] Платеж успешен! ID:', payment.id);

        const orderData = pendingOrders.get(payment.id);
        if (!orderData) {
            console.log('[Webhook] Заказ для платежа не найден:', payment.id);
            return res.status(200).send('OK');
        }

        try {
            console.log('[Webhook] Создаем заказ в CDEK...');
            const cdekResult = await createCdekOrder(orderData);

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

            console.log('[Webhook] Заказ создан в CDEK:', cdekResult.order_uuid);

        } catch (error) {
            console.error('[Webhook] Ошибка создания заказа в CDEK:', error.message);

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

            console.log('[Webhook] Заказ сохранен как failed:', failedOrder.id);
        }
    } else {
        console.log('[Webhook] Неизвестный тип уведомления:', { type, event, status: payment?.status });
    }

    res.status(200).send('OK');
});

// =============================================================
// ====  API заказов                                       ====
// =============================================================
app.get('/api/orders', (req, res) => {
    const orders = Array.from(completedOrders.values()).sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    console.log('[API /api/orders] Возвращаем заказов:', orders.length);
    res.json(orders);
});

app.get('/api/orders/:orderId', (req, res) => {
    const order = completedOrders.get(req.params.orderId);
    if (!order) {
        return res.status(404).json({ error: 'Заказ не найден' });
    }
    res.json(order);
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('[Server Error]', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Проверка соединения с CDEK при старте
async function testCdekConnection() {
    try {
        console.log('[Startup] Проверка соединения с CDEK...');
        const token = await getCdekToken();
        console.log('✅ Соединение с CDEK установлено');
        return true;
    } catch (error) {
        console.error('❌ Ошибка соединения с CDEK:', error.message);
        return false;
    }
}

// Запуск сервера
app.listen(PORT, async () => {
    console.log(`🚀 Server запущен на http://localhost:${PORT}`);
    console.log(`📦 Вебхук YooKassa: https://your-ngrok-url/api/payment/webhook`);
    console.log(`📋 API заказов: http://localhost:${PORT}/api/orders`);
    console.log(`👤 Профиль: http://localhost:${PORT}/profile/profile.html`);
    console.log(`🔧 CDEK API: ${CDEK_BASE}`);

    // Проверяем соединение с CDEK
    await testCdekConnection();

    console.log('🎉 Сервер готов к работе!');
});