// WEB/server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Базовый URL для API СДЭК
const CDEK_BASE = 'https://cdek.orderadmin.ru/api';
// Собираем Basic Auth из .env
const auth = Buffer.from(`${process.env.CDEK_USER}:${process.env.CDEK_PASSWORD}`).toString('base64');

// Раздаём всё содержимое папки WEB как статику
app.use(express.static(path.join(__dirname)));

// 1) Поиск городов (autocomplete)
app.get('/api/cdek/cities', async (req, res) => {
    const q = (req.query.q||'').trim();
    if (!q) return res.status(400).json({ error: 'q parameter missing' });

    // частичный поиск по name, только города
    const url = `${CDEK_BASE}/locations/localities`
        + `?filter[0][type]=ilike&filter[0][field]=name&filter[0][value]=${encodeURIComponent(q)}%25`
        + `&filter[1][type]=eq&filter[1][field]=type&filter[1][value]=город`;

    try {
        const r = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`,
            }
        });
        const json = await r.json();
        return res.json(json._embedded?.localities || []);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'CDEK cities API error' });
    }
});

// 2) Список ПВЗ по ID города
app.get('/api/cdek/pvz', async (req, res) => {
    const cityId = req.query.cityId;
    if (!cityId) return res.status(400).json({ error: 'cityId missing' });

    const url = `${CDEK_BASE}/delivery-services/service-points`
        + `?filter[0][type]=eq&filter[0][field]=city&filter[0][value]=${encodeURIComponent(cityId)}`;

    try {
        const r = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`,
            }
        });
        const json = await r.json();
        return res.json(json._embedded?.items || []);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'CDEK PVZ API error' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});