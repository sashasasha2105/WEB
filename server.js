// File: server.js


require('dotenv').config();
const path    = require('path');
const express = require('express');
const fetch   = require('node-fetch');

const app       = express();
const PORT      = process.env.PORT || 3000;
// Хост и базовый путь без лишнего "/api"
const CDEK_HOST = process.env.CDEK_HOST   || 'https://api.edu.cdek.ru';
const CDEK_BASE = process.env.CDEK_API_BASE|| 'https://api.edu.cdek.ru';

const authHeader = Buffer
    .from(`${process.env.CDEK_CLIENT_ID}:${process.env.CDEK_CLIENT_SECRET}`)
    .toString('base64');

app.use(express.static(path.join(__dirname)));
app.use(express.json());

/**
 * Получаем и кешируем OAuth-токен
 */
async function ensureToken() {
    if (ensureToken.token && Date.now() < ensureToken.expires) {
        return ensureToken.token;
    }
    const url = `${CDEK_HOST}/v2/oauth/token`;
    console.log(`[CDEK] Запрос токена → ${url}`);
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type:    'client_credentials',
            client_id:     process.env.CDEK_CLIENT_ID,
            client_secret: process.env.CDEK_CLIENT_SECRET
        })
    });
    const text = await res.text();
    if (!res.ok) {
        console.error(`[CDEK] Ошибка токена ${res.status} — ${text}`);
        throw new Error(`Token request failed: ${res.status} — ${text}`);
    }
    const json = JSON.parse(text);
    ensureToken.token   = json.access_token;
    ensureToken.expires = Date.now() + (json.expires_in * 1000) - 5000;
    console.log(`[CDEK] Токен получен, действует ${json.expires_in} сек`);
    return ensureToken.token;
}

/**
 * Подсказки городов (suggested cities)
 */
app.get('/api/cdek/cities', async (req, res) => {
    const search = (req.query.search || '').trim();
    if (!search) return res.status(400).json({ error: 'search parameter missing' });
    try {
        const token = await ensureToken();
        // Собираем URL без лишнего "/api"
        const url = `${CDEK_BASE}/v2/location/suggest/cities?limit=10&name=${encodeURIComponent(search)}`;
        console.log(`[CitiesSuggest] -> ${url}`);
        const r = await fetch(url, {
            headers: {
                'Accept':        'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(`[CitiesSuggest] ответ HTTP ${r.status}`);
        const body = await r.text();
        try {
            const json = JSON.parse(body);
            console.log(`[CitiesSuggest] найдено ${json.length}`);
            return res.json(json);
        } catch {
            console.error(`[CitiesSuggest] ошибка парсинга JSON`, body);
            return res.status(502).json({ error: 'Invalid JSON from CDEK' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'CDEK cities API error' });
    }
});

/**
 * Список ПВЗ по коду города
 */
app.get('/api/cdek/pvz', async (req, res) => {
    const cityId = req.query.cityId;
    if (!cityId) return res.status(400).json({ error: 'cityId missing' });
    try {
        const token = await ensureToken();
        const url   = `${CDEK_BASE}/v2/location/service-points?city_code=${encodeURIComponent(cityId)}`;
        console.log(`[PVZ] -> ${url}`);
        const r     = await fetch(url, {
            headers: {
                'Accept':        'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(`[PVZ] ответ HTTP ${r.status}`);
        const json = await r.json();
        res.json(json.items || []);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'CDEK PVZ API error' });
    }
});

/**
 * Расчёт тарифа
 */
app.post('/api/cdek/tariff', async (req, res) => {
    const body = req.body;
    if (!body) return res.status(400).json({ error: 'body missing' });
    try {
        const token = await ensureToken();
        const url   = `${CDEK_BASE}/v2/tariff`;
        console.log(`[Tariff] -> ${url}`, body);
        const r     = await fetch(url, {
            method:  'POST',
            headers: {
                'Accept':        'application/json',
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        console.log(`[Tariff] ответ HTTP ${r.status}`);
        const json = await r.json();
        res.json(json);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'CDEK tariff API error' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server запущен на http://localhost:${PORT}`);
});