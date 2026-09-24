const express = require('express');
const cors = require('cors');
const { randomBytes } = require('node:crypto');
const { ObjectId } = require('mongodb');
const { rateLimit } = require('express-rate-limit');

function createApp(db, { authenticate = async () => { throw new Error('Autenticación no configurada'); }, sessionTtlMs = 3600000, now = Date.now } = {}) {
    const app = express();
    const sessions = new Map();
    app.use(cors());
    app.use(express.json({ limit: '8kb' }));
    app.use((req, res, next) => {
        res.set('Cache-Control', 'no-store');
        for (const [token, session] of sessions) {
            if (session.expiresAt <= now()) sessions.delete(token);
        }
        next();
    });

    app.post('/auth/login', rateLimit({
        windowMs: 60000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
        message: { error: 'Demasiados intentos. Espera un minuto antes de volver a intentar.' },
    }), async (req, res) => {
        const { username, password } = req.body || {};
        if (typeof username !== 'string' || !username.trim() || username.length > 256 || typeof password !== 'string' || !password || password.length > 1024) {
            return res.status(400).json({ error: 'Escribe tu usuario y contraseña de MongoDB.' });
        }
        try {
            await authenticate(username.trim(), password);
            const token = randomBytes(32).toString('hex');
            const session = { username: username.trim(), expiresAt: now() + sessionTtlMs };
            sessions.set(token, session);
            res.json({ token, ...session });
        } catch (error) {
            if (error.code === 18) return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
            if (error.code === 13) return res.status(403).json({ error: 'Este usuario no tiene permiso para consultar las películas.' });
            res.status(503).json({ error: 'No se pudo validar el acceso con Atlas. Revisa la conexión y la IP autorizada.' });
        }
    });

    function requireSession(req, res, next) {
        const token = req.headers.authorization?.replace(/^Bearer /, '');
        if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Inicia sesión para consultar el catálogo.' });
        req.sessionToken = token;
        next();
    }

    app.post('/auth/logout', requireSession, (req, res) => {
        sessions.delete(req.sessionToken);
        res.sendStatus(204);
    });

    app.get('/health', async (req, res) => {
        try {
            await db.command({ ping: 1 });
            res.json({ status: 'ok' });
        } catch {
            res.status(503).json({ error: 'MongoDB no está disponible' });
        }
    });

    app.use('/movies', requireSession);
    app.get('/movies', async (req, res) => {
        try {
            const movies = await db.collection('movies')
                .find({}, { projection: { title: 1, plot: 1, poster: 1, year: 1, genres: 1 } })
                .sort({ _id: 1 })
                .limit(100)
                .maxTimeMS(10000)
                .toArray();
            res.json(movies);
        } catch {
            res.status(500).json({ error: 'Error al obtener las películas' });
        }
    });

    app.get('/movies/:id', async (req, res) => {
        if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(400).json({ error: 'El identificador de la película no es válido.' });
        try {
            const movie = await db.collection('movies').findOne({ _id: new ObjectId(req.params.id) }, {
                projection: { title: 1, fullplot: 1, plot: 1, poster: 1, year: 1, released: 1, runtime: 1, rated: 1, genres: 1, cast: 1, directors: 1, writers: 1, languages: 1, countries: 1, imdb: 1, awards: 1 },
                maxTimeMS: 10000,
            });
            if (!movie) return res.status(404).json({ error: 'No se encontró esta película.' });
            res.json(movie);
        } catch {
            res.status(500).json({ error: 'No se pudo obtener el detalle de la película.' });
        }
    });

    app.use((error, req, res, next) => {
        res.status(error.status === 400 ? 400 : error.status === 413 ? 413 : 500).json({ error: 'La solicitud no es válida.' });
    });

    return app;
}

module.exports = { createApp };
