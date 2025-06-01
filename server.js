// === File: server.js ===

require('dotenv').config();
const express = require('express');
const fetch   = require('node-fetch');
const path    = require('path');

const app       = express();
const PORT      = process.env.PORT || 3000;
const CDEK_HOST = process.env.CDEK_HOST;
const CDEK_BASE = process.env.CDEK_API_BASE;
const Y_SUG_KEY = process.env.YANDEX_SUGGEST_KEY;

app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Отдаём клиенту ключи
app.get('/config.js', (_, res) => {
    console.log('[Server] Запрошен /config.js');
    res.type('application/javascript').send(`
    window.__ENV = {
      YANDEX_JSAPI_KEY: "${process.env.YANDEX_JSAPI_KEY}",
      YANDEX_SUGGEST_KEY: "${Y_SUG_KEY}"
    };
  `);
});

// Кеш OAuth-токена
let cdekToken = null, cdekExp = 0;
async function getCdekToken() {
    if (cdekToken && Date.now() < cdekExp) {
        console.log('[getCdekToken] Используем кеш токена');
        return cdekToken;
    }
    console.log('[getCdekToken] Запрос нового токена у CDEK');
    const resp = await fetch(`${CDEK_HOST}/v2/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type:    'client_credentials',
            client_id:     process.env.CDEK_CLIENT_ID,
            client_secret: process.env.CDEK_CLIENT_SECRET
        })
    });
    const j = await resp.json();
    cdekToken = j.access_token;
    cdekExp   = Date.now() + j.expires_in * 1000 - 5000;
    console.log('[getCdekToken] Новый токен получен, expires_in=', j.expires_in);
    return cdekToken;
}

// Прокси для подсказок городов
app.get('/api/cdek/cities', async (req, res) => {
    const q = (req.query.search || '').trim();
    if (!q) return res.status(400).json({ error: 'missing search' });
    console.log('[API /api/cdek/cities] Получен запрос:', q);
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

// Прокси для списка офисов (ПВЗ + постаматов)
app.get('/api/cdek/pvz', async (req, res) => {
    const cityCode = req.query.cityId;
    const page     = req.query.page || 0;
    if (!cityCode) return res.status(400).json({ error: 'missing cityId' });
    console.log(`[API /api/cdek/pvz] Запрос ПВЗ: cityId=${cityCode}, page=${page}`);
    try {
        const tok = await getCdekToken();
        const url = `${CDEK_BASE}/v2/deliverypoints`
            + `?city_code=${encodeURIComponent(cityCode)}`
            + `&type=ALL&size=1000&page=${page}`;
        const r = await fetch(url, {
            headers: { Authorization: `Bearer ${tok}`, Accept: 'application/json' }
        });
        const text = await r.text();
        let json;
        try { json = text ? JSON.parse(text) : []; }
        catch { json = []; }
        res.set('x-total-pages', r.headers.get('x-total-pages') || '1');
        console.log('[API /api/cdek/pvz] Ответ от CDEK:', json.length, 'пункт(ов)');
        return res.status(200).json(json);
    } catch (e) {
        console.error('[API /api/cdek/pvz] Ошибка:', e);
        return res.status(500).json({ error: 'cdek pvz failed' });
    }
});

// Прокси для калькулятора тарифов
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

// Прокси для Yandex Suggest
app.get('/api/yandex/suggest', async (req, res) => {
    const text = (req.query.text || '').trim();
    if (!text) return res.status(400).json({ error: 'missing text' });
    console.log('[API /api/yandex/suggest] Запрос подсказок Yandex для:', text);
    const url = `https://suggest-maps.yandex.ru/v1/suggest?apikey=${Y_SUG_KEY}`
        + `&text=${encodeURIComponent(text)}&lang=ru_RU&results=7`;
    try {
        const r = await fetch(url);
        const body = await r.text();
        let json;
        try { json = body ? JSON.parse(body) : { results: [] }; }
        catch { json = { results: [] }; }
        console.log('[API /api/yandex/suggest] Ответ от Яндекс:', json);
        return res.json(json);
    } catch (e) {
        console.error('[API /api/yandex/suggest] Ошибка:', e);
        return res.status(500).json({ error: 'suggest failed' });
    }
});

app.listen(PORT, () => console.log(`🚀 Server запущен на http://localhost:${PORT}`));
// === Конец файла server.js ===