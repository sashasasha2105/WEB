require('dotenv').config();
const express = require('express');
const fetch   = require('node-fetch');
const path    = require('path');

const app       = express();
const PORT      = process.env.PORT || 3000;
const CDEK_HOST = process.env.CDEK_HOST;
const CDEK_BASE = process.env.CDEK_API_BASE;
const Y_JS_KEY  = process.env.YANDEX_JSAPI_KEY;
const Y_SUG_KEY = process.env.YANDEX_SUGGEST_KEY;

// Отдаём клиенту ключи
app.get('/config.js', (_, res) => {
    res.type('application/javascript').send(
        `window.__ENV={YANDEX_JSAPI_KEY:"${Y_JS_KEY}",YANDEX_SUGGEST_KEY:"${Y_SUG_KEY}"};`
    );
});

app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Кеш OAuth-токена CDEK
let cdekToken = null, cdekExp = 0;
async function getCdekToken() {
    if (cdekToken && Date.now() < cdekExp) return cdekToken;
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
    return cdekToken;
}

// CDEK: подсказки городов
app.get('/api/cdek/cities', async (req, res) => {
    const q = (req.query.search || '').trim();
    if (!q) return res.status(400).json({ error: 'missing search' });
    try {
        const tok = await getCdekToken();
        const r = await fetch(
            `${CDEK_BASE}/v2/location/suggest/cities?limit=10&name=${encodeURIComponent(q)}`,
            { headers: { Authorization: `Bearer ${tok}` } }
        );
        const json = await r.json();
        res.status(r.status).json(json);
    } catch (e) {
        console.error('CDEK cities error', e);
        res.status(500).json({ error: 'cdek cities failed' });
    }
});

// CDEK: список ПВЗ
app.get('/api/cdek/pvz', async (req, res) => {
    const cityId = req.query.cityId;
    if (!cityId) return res.status(400).json({ error: 'missing cityId' });
    try {
        const tok = await getCdekToken();
        const r = await fetch(
            `${CDEK_BASE}/v2/location/service-points?city_code=${encodeURIComponent(cityId)}`,
            { headers: { Authorization: `Bearer ${tok}` } }
        );
        const j = await r.json();
        res.status(r.status).json(j.items || []);
    } catch (e) {
        console.error('CDEK pvz error', e);
        res.status(500).json({ error: 'cdek pvz failed' });
    }
});

// Yandex HTTP-Suggest v1 прокси
app.get('/api/yandex/suggest', async (req, res) => {
    const text = (req.query.text || '').trim();
    if (!text) return res.status(400).json({ error: 'missing text' });
    const url = `https://suggest-maps.yandex.ru/v1/suggest?apikey=${Y_SUG_KEY}`
        + `&text=${encodeURIComponent(text)}&lang=ru_RU&results=7`;
    try {
        const r = await fetch(url);
        const body = await r.text();
        if (!body) {
            console.warn('Yandex suggest empty body');
            return res.json({ results: [] });
        }
        let json;
        try {
            json = JSON.parse(body);
        } catch {
            console.warn('Yandex suggest invalid JSON:', body);
            json = { results: [] };
        }
        return res.json(json);
    } catch (e) {
        console.error('Suggest fetch error', e);
        return res.status(500).json({ error: 'suggest failed' });
    }
});

app.listen(PORT, () => console.log(`🚀 Server запущен на http://localhost:${PORT}`));