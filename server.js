// File: server.js

require('dotenv').config();
const express = require('express');
const path = require('path');
const { randomUUID } = require('crypto');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const CDEK_HOST = process.env.CDEK_HOST;
const CDEK_BASE = process.env.CDEK_API_BASE;
const Y_SUG_KEY = process.env.YANDEX_SUGGEST_KEY;

// YooKassa
const YOO_SHOP_ID = process.env.YOO_KASSA_SHOP_ID;
const YOO_SECRET_KEY = process.env.YOO_KASSA_SECRET_KEY;

// =========================================
// ====  Middleware & Security           ====
// =========================================

// Базовая защита с helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://api-maps.yandex.ru", "https://suggest-maps.yandex.ru"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://api-maps.yandex.ru", "https://suggest-maps.yandex.ru"]
        }
    }
}));

// CORS настройки
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? 'https://yourdomain.com'
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум 100 запросов
    message: 'Слишком много запросов с вашего IP, попробуйте позже'
});

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // для критичных эндпоинтов
    message: 'Превышен лимит запросов'
});

app.use('/api/', limiter);
app.use('/api/yookassa/', strictLimiter);
app.use('/api/cdek/orders', strictLimiter);

// Парсинг JSON с лимитом размера
app.use(express.json({ limit: '10mb' }));

// Статические файлы с кешированием
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    etag: true
}));

// Логирование
const logger = {
    info: (msg, data) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`, data || ''),
    error: (msg, error) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, error || ''),
    warn: (msg, data) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`, data || '')
};

// =========================================
// ====  Validation Helpers              ====
// =========================================

const validators = {
    phone: (phone) => /^[\d\s\-\+\(\)]+$/.test(phone) && phone.length >= 10,
    email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    text: (text, minLen = 2, maxLen = 100) => text && text.length >= minLen && text.length <= maxLen,
    number: (num, min = 0, max = 1000000) => !isNaN(num) && num >= min && num <= max
};

// =========================================
// ====  Config endpoint                 ====
// =========================================

app.get('/config.js', (req, res) => {
    logger.info('Config.js requested');
    res.type('application/javascript').send(`
    window.__ENV = {
      YANDEX_JSAPI_KEY: "${process.env.YANDEX_JSAPI_KEY || ''}",
      YANDEX_SUGGEST_KEY: "${Y_SUG_KEY || ''}"
    };
  `);
});

// =========================================
// ====  CDEK OAuth with caching         ====
// =========================================
let cdekToken = null;
let cdekExp = 0;

async function getCdekToken() {
    if (cdekToken && Date.now() < cdekExp) {
        return cdekToken;
    }

    logger.info('Requesting new CDEK token');

    try {
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
            throw new Error(`CDEK OAuth failed: ${resp.status}`);
        }

        const json = await resp.json();
        cdekToken = json.access_token;
        cdekExp = Date.now() + json.expires_in * 1000 - 5000;
        logger.info('CDEK token obtained', { expires_in: json.expires_in });
        return cdekToken;
    } catch (error) {
        logger.error('Failed to get CDEK token', error);
        throw error;
    }
}

// =========================================
// ====  Yandex Suggest proxy            ====
// =========================================
app.get('/api/yandex/suggest', async (req, res) => {
    const text = (req.query.text || '').trim();

    if (!validators.text(text, 2, 50)) {
        return res.status(400).json({ error: 'Invalid text parameter' });
    }

    if (!Y_SUG_KEY) {
        logger.error('YANDEX_SUGGEST_KEY not configured');
        return res.status(500).json({ error: 'Service unavailable' });
    }

    const url = `https://suggest-maps.yandex.ru/v1/suggest?apikey=${encodeURIComponent(Y_SUG_KEY)}` +
        `&text=${encodeURIComponent(text)}&lang=ru_RU&results=7`;

    try {
        const r = await fetch(url);
        const body = await r.text();
        let json;
        try {
            json = body ? JSON.parse(body) : { results: [] };
        } catch {
            json = { results: [] };
        }
        return res.json(json);
    } catch (e) {
        logger.error('Yandex suggest error', e);
        return res.status(500).json({ error: 'Service error' });
    }
});

// =========================================
// ====  CDEK Cities search              ====
// =========================================
app.get('/api/cdek/cities', async (req, res) => {
    const q = (req.query.search || '').trim();

    if (!validators.text(q, 2, 50)) {
        return res.status(400).json({ error: 'Invalid search parameter' });
    }

    try {
        const tok = await getCdekToken();
        const r = await fetch(
            `${CDEK_BASE}/v2/location/suggest/cities?limit=10&name=${encodeURIComponent(q)}`,
            { headers: { Authorization: `Bearer ${tok}` } }
        );
        const text = await r.text();
        let json;
        try {
            json = text ? JSON.parse(text) : [];
        } catch {
            json = [];
        }
        return res.status(r.status).json(json);
    } catch (e) {
        logger.error('CDEK cities error', e);
        return res.status(500).json({ error: 'Service error' });
    }
});

// =========================================
// ====  CDEK PVZ list                   ====
// =========================================
app.get('/api/cdek/pvz', async (req, res) => {
    const cityCode = req.query.cityId;
    const page = parseInt(req.query.page) || 0;

    if (!cityCode || !validators.number(parseInt(cityCode), 1, 999999)) {
        return res.status(400).json({ error: 'Invalid cityId' });
    }

    if (!validators.number(page, 0, 100)) {
        return res.status(400).json({ error: 'Invalid page' });
    }

    try {
        const tok = await getCdekToken();
        const url = `${CDEK_BASE}/v2/deliverypoints?city_code=${encodeURIComponent(cityCode)}` +
            `&type=ALL&size=1000&page=${page}`;
        const r = await fetch(url, {
            headers: { Authorization: `Bearer ${tok}`, Accept: 'application/json' }
        });
        const text = await r.text();
        let json;
        try {
            json = text ? JSON.parse(text) : [];
        } catch {
            json = [];
        }
        const totalPagesHeader = r.headers.get('x-total-pages') || '1';
        res.set('x-total-pages', totalPagesHeader);
        return res.status(200).json(json);
    } catch (e) {
        logger.error('CDEK PVZ error', e);
        return res.status(500).json({ error: 'Service error' });
    }
});

// =========================================
// ====  CDEK Calculator                 ====
// =========================================
app.post('/api/cdek/calculator/tariff', async (req, res) => {
    // Валидация тела запроса
    const { tariff_code, from_location, to_location, packages } = req.body;

    if (!tariff_code || !from_location || !to_location || !packages) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!Array.isArray(packages) || packages.length === 0) {
        return res.status(400).json({ error: 'Invalid packages array' });
    }

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
        return res.status(r.status).json(json);
    } catch (e) {
        logger.error('CDEK calculator error', e);
        return res.status(500).json({ error: 'Service error' });
    }
});

// =========================================
// ====  CDEK Order Creation             ====
// =========================================
app.post('/api/cdek/orders', async (req, res) => {
    const { type, tariff_code, recipient, packages } = req.body;

    // Валидация
    if (!type || !tariff_code || !recipient || !packages) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!recipient.name || !validators.text(recipient.name, 2, 100)) {
        return res.status(400).json({ error: 'Invalid recipient name' });
    }

    if (!recipient.phones || !recipient.phones[0] || !validators.phone(recipient.phones[0].number)) {
        return res.status(400).json({ error: 'Invalid recipient phone' });
    }

    if (recipient.email && !validators.email(recipient.email)) {
        return res.status(400).json({ error: 'Invalid recipient email' });
    }

    try {
        const tok = await getCdekToken();
        const orderData = {
            ...req.body,
            number: `CG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            comment: 'Заказ с сайта clip & go'
        };

        const r = await fetch(`${CDEK_BASE}/v2/orders`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${tok}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const json = await r.json();

        if (r.ok) {
            logger.info('CDEK order created', { order_uuid: json.entity?.uuid });
        } else {
            logger.error('CDEK order creation failed', json);
        }

        return res.status(r.status).json(json);
    } catch (e) {
        logger.error('CDEK order error', e);
        return res.status(500).json({ error: 'Service error' });
    }
});

// =========================================
// ====  YooKassa Payment Creation       ====
// =========================================
app.post('/api/yookassa/create-payment', async (req, res) => {
    const { amount, currency, description, metadata } = req.body;

    // Валидация
    if (!validators.number(amount, 1, 1000000)) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!currency || currency !== 'RUB') {
        return res.status(400).json({ error: 'Invalid currency' });
    }

    if (!YOO_SHOP_ID || !YOO_SECRET_KEY) {
        logger.error('YooKassa credentials not configured');
        return res.status(500).json({ error: 'Payment service unavailable' });
    }

    const auth = Buffer.from(`${YOO_SHOP_ID}:${YOO_SECRET_KEY}`).toString('base64');
    const idemKey = randomUUID();

    const paymentRequest = {
        amount: {
            value: amount.toFixed(2),
            currency: currency
        },
        confirmation: {
            type: 'redirect',
            return_url: `${req.protocol}://${req.get('host')}/payment/payment-result.html`
        },
        capture: true,
        description: description || 'Оплата заказа clip & go',
        metadata: metadata || {}
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
            logger.error('YooKassa payment creation failed', payment);
            return res.status(response.status).json(payment);
        }

        const confirmationUrl = payment.confirmation?.confirmation_url;

        if (!confirmationUrl) {
            return res.status(500).json({ error: 'No confirmation URL received' });
        }

        logger.info('YooKassa payment created', { payment_id: payment.id });
        return res.json({ confirmation_url: confirmationUrl, payment_id: payment.id });
    } catch (err) {
        logger.error('YooKassa payment error', err);
        return res.status(500).json({ error: 'Payment service error' });
    }
});

// =========================================
// ====  Health check endpoint           ====
// =========================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            cdek: !!cdekToken,
            yookassa: !!YOO_SHOP_ID,
            yandex: !!Y_SUG_KEY
        }
    });
});

// =========================================
// ====  404 handler                     ====
// =========================================
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// =========================================
// ====  Error handler                   ====
// =========================================
app.use((err, req, res, next) => {
    logger.error('Unhandled error', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// =========================================
// ====  Start server                    ====
// =========================================
app.listen(PORT, () => {
    logger.info(`Server started on http://localhost:${PORT}`);
    logger.info('Environment:', {
        nodeEnv: process.env.NODE_ENV || 'development',
        cdekConfigured: !!process.env.CDEK_CLIENT_ID,
        yookassaConfigured: !!YOO_SHOP_ID,
        yandexConfigured: !!Y_SUG_KEY
    });
});