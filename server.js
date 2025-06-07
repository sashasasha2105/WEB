// File: server.js

require('dotenv').config();
const express = require('express');
const path    = require('path');
const { randomUUID } = require('crypto');  // для генерации Idempotence-Key

const app       = express();
const PORT      = process.env.PORT || 3000;
const CDEK_HOST = process.env.CDEK_HOST;
const CDEK_BASE = process.env.CDEK_API_BASE;
const Y_SUG_KEY = process.env.YANDEX_SUGGEST_KEY;

// YooKassa
const YOO_SHOP_ID    = process.env.YOO_KASSA_SHOP_ID;
const YOO_SECRET_KEY = process.env.YOO_KASSA_SECRET_KEY;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


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
let cdekExp   = 0;

async function getCdekToken() {
    if (cdekToken && Date.now() < cdekExp) {
        return cdekToken;
    }
    console.log('[getCdekToken] Запрашиваем новый токен CDEK...');
    const resp = await fetch(`${CDEK_HOST}/v2/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type:    'client_credentials',
            client_id:     process.env.CDEK_CLIENT_ID,
            client_secret: process.env.CDEK_CLIENT_SECRET
        })
    });
    if (!resp.ok) {
        console.error('[getCdekToken] Ошибка при получении токена:', resp.status, await resp.text());
        throw new Error('CDEK OAuth failed');
    }
    const json = await resp.json();
    cdekToken = json.access_token;
    cdekExp   = Date.now() + json.expires_in * 1000 - 5000;
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
    const page     = req.query.page || 0;
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


// =============================================================
// ====  Прокси для создания платежа в YooKassa (v3 API)       ====
// =============================================================
//
// Теперь добавляем заголовок "Idempotence-Key" со случайным UUID
//
app.post('/api/yookassa/create-payment', async (req, res) => {
    const { amount, currency, description } = req.body;
    if (typeof amount !== 'number' || !currency) {
        return res.status(400).json({ error: 'Missing amount or currency' });
    }
    if (!YOO_SHOP_ID || !YOO_SECRET_KEY) {
        console.error('[API /api/yookassa/create-payment] Параметры YOO_KASSA не заданы.');
        return res.status(500).json({ error: 'yookassa credentials missing' });
    }

    console.log('[API /api/yookassa/create-payment] amount=', amount, 'currency=', currency);

    // Basic Auth (shopId:secretKey → base64)
    const auth = Buffer.from(`${YOO_SHOP_ID}:${YOO_SECRET_KEY}`).toString('base64');

    // Генерируем уникальный ключ для Idempotence-Key
    const idemKey = randomUUID();

    // Формируем тело запроса к YooKassa
    const paymentRequest = {
        amount: {
            value: amount.toFixed(2),
            currency: currency
        },
        confirmation: {
            type: 'redirect',
            // После оплаты YooKassa сделает редирект на эту страницу:
            return_url: `http://localhost:${PORT}/payment/payment-result.html`
        },
        capture: true,
        description: description || 'Оплата заказа clip & go'
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
        // В ответе YooKassa приходит confirmation: { confirmation_url: "..." }
        const confirmationUrl = payment.confirmation && payment.confirmation.confirmation_url;
        console.log('[API /api/yookassa/create-payment] confirmation_url =', confirmationUrl);

        if (!confirmationUrl) {
            return res.status(500).json({ error: 'confirmation_url missing in YooKassa response' });
        }
        return res.json({ confirmation_url: confirmationUrl });
    } catch (err) {
        console.error('[API /api/yookassa/create-payment] Ошибка:', err);
        return res.status(500).json({ error: 'yookassa create payment failed' });
    }
});


// Запускаем сервер
app.listen(PORT, () => {
    console.log(`🚀 Server запущен на http://localhost:${PORT}`);
});