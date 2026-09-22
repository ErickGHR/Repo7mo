const express = require('express');
const cors = require('cors');

function createApp(db) {
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.get('/health', async (req, res) => {
        try {
            await db.command({ ping: 1 });
            res.json({ status: 'ok' });
        } catch {
            res.status(503).json({ error: 'MongoDB no está disponible' });
        }
    });

    app.get('/movies', async (req, res) => {
        try {
            const movies = await db.collection('movies')
                .find({}, { projection: { title: 1, fullplot: 1, plot: 1, poster: 1 } })
                .sort({ _id: 1 })
                .limit(100)
                .maxTimeMS(10000)
                .toArray();
            res.json(movies);
        } catch {
            res.status(500).json({ error: 'Error al obtener las películas' });
        }
    });

    return app;
}

module.exports = { createApp };
