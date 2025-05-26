require('dotenv').config();
const path = require('path');
const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Базовый URL для API СДЭК
const CDEK_BASE = 'https://cdek.orderadmin.ru/api';

// Basic Auth из .env (CDEK_CLIENT_ID и CDEK_CLIENT_SECRET)
const auth = Buffer
    .from(`${process.env.CDEK_CLIENT_ID}:${process.env.CDEK_CLIENT_SECRET}`)
    .toString('base64');

// Статика и JSON-парсинг
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// 1) Поиск городов (autocomplete) через v2
app.get('/api/cdek/cities', async (req, res) => {
    const search = (req.query.search || '').trim();
    if (!search) return res.status(400).json({ error: 'search parameter missing' });

    const url = `${CDEK_BASE}/v2/location/cities?search=${encodeURIComponent(search)}`;
    try {
        const r = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`,
            }
        });
        const json = await r.json();
        return res.json(json.cities || []);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'CDEK cities API error' });
    }
});

// 2) Список ПВЗ по ID города
app.get('/api/cdek/pvz', async (req, res) => {
    const cityId = req.query.cityId;
    if (!cityId) return res.status(400).json({ error: 'cityId missing' });

    const url = `${CDEK_BASE}/v2/location/service-points?city_code=${encodeURIComponent(cityId)}`;
    try {
        const r = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`,
            }
        });
        const json = await r.json();
        return res.json(json.items || []);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'CDEK PVZ API error' });
    }
});

// 3) Расчёт тарифа
app.post('/api/cdek/tariff', async (req, res) => {
    const body = req.body;
    if (!body) return res.status(400).json({ error: 'body missing' });

    const url = `${CDEK_BASE}/v2/tariff`;
    try {
        const r = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`,
            },
            body: JSON.stringify(body)
        });
        const json = await r.json();
        return res.json(json);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'CDEK tariff API error' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});