const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ObjectId } = require('mongodb');
const { createApp } = require('../app');

async function listen(t, db, options = {}) {
    const server = createApp(db, { authenticate: async (user, password) => {
        if (user !== 'test' || password !== 'correct') throw Object.assign(new Error('privado'), { code: 18 });
    }, ...options }).listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
    });
    t.after(() => new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
    }));
    return `http://127.0.0.1:${server.address().port}`;
}

async function login(url) {
    const response = await fetch(`${url}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'test', password: 'correct' }) });
    assert.equal(response.status, 200);
    const body = await response.json();
    return { Authorization: `Bearer ${body.token}` };
}

test('GET /movies devuelve películas con IDs de MongoDB serializados y CORS', async (t) => {
    const id = new ObjectId();
    const cursor = {
        sort() { return this; },
        limit() { return this; },
        maxTimeMS() { return this; },
        async toArray() { return [{ _id: id, title: 'Película de prueba' }]; },
    };
    const url = await listen(t, { collection: () => ({ find: () => cursor }) });
    const response = await fetch(`${url}/movies`, { headers: await login(url) });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), '*');
    assert.deepEqual(await response.json(), [{ _id: id.toHexString(), title: 'Película de prueba' }]);
});

test('GET /movies comunica un fallo de MongoDB sin filtrar detalles internos', async (t) => {
    const url = await listen(t, { collection() { throw new Error('detalle privado'); } });
    const response = await fetch(`${url}/movies`, { headers: await login(url) });
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'Error al obtener las películas' });
});

test('GET /health comprueba que MongoDB responde', async (t) => {
    const url = await listen(t, { async command() { return { ok: 1 }; } });
    const response = await fetch(`${url}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
});

test('GET /health responde 503 cuando MongoDB deja de estar disponible', async (t) => {
    const url = await listen(t, { async command() { throw new Error('sin conexión'); } });
    const response = await fetch(`${url}/health`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'MongoDB no está disponible' });
});

test('catálogo y detalle rechazan solicitudes sin sesión', async (t) => {
    const url = await listen(t, {});
    assert.equal((await fetch(`${url}/movies`)).status, 401);
    assert.equal((await fetch(`${url}/movies/${new ObjectId()}`)).status, 401);
});

test('login rechaza contraseña incorrecta y campos malformados', async (t) => {
    const url = await listen(t, {});
    for (const [body, status] of [[{ username: 'test', password: 'wrong' }, 401], [{ username: {}, password: 'x' }, 400], [{}, 400]]) {
        const response = await fetch(`${url}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        assert.equal(response.status, status);
    }
});

test('logout invalida la sesión en el servidor', async (t) => {
    const url = await listen(t, {});
    const headers = await login(url);
    assert.equal((await fetch(`${url}/auth/logout`, { method: 'POST', headers })).status, 204);
    assert.equal((await fetch(`${url}/movies`, { headers })).status, 401);
});

test('las sesiones vencidas no pueden consultar películas', async (t) => {
    let time = 0;
    const url = await listen(t, {}, { now: () => time, sessionTtlMs: 100 });
    const headers = await login(url);
    time = 101;
    assert.equal((await fetch(`${url}/movies`, { headers })).status, 401);
});

test('detalle devuelve sinopsis, año y equipo, y maneja IDs inválidos e inexistentes', async (t) => {
    const id = new ObjectId();
    const movie = { _id: id, title: 'Prueba', fullplot: 'Sinopsis completa', year: 2026, cast: ['Actriz'], directors: ['Director'], writers: ['Guionista'] };
    const url = await listen(t, { collection: () => ({ findOne: async (filter) => filter._id.equals(id) ? movie : null }) });
    const headers = await login(url);
    const response = await fetch(`${url}/movies/${id}`, { headers });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ...movie, _id: id.toHexString() });
    assert.equal((await fetch(`${url}/movies/no-valido`, { headers })).status, 400);
    assert.equal((await fetch(`${url}/movies/${new ObjectId()}`, { headers })).status, 404);
});

test('distingue fallos de red y falta de permisos de una contraseña incorrecta', async (t) => {
    for (const [code, status] of [[13, 403], [undefined, 503]]) {
        const url = await listen(t, {}, { authenticate: async () => { throw Object.assign(new Error('privado'), { code }); } });
        const response = await fetch(`${url}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'test', password: 'correct' }) });
        assert.equal(response.status, status);
        assert.ok(!(await response.text()).includes('privado'));
    }
});
