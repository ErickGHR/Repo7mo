const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ObjectId } = require('mongodb');
const { createApp } = require('../app');

async function listen(t, db) {
    const server = createApp(db).listen(0, '127.0.0.1');
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

test('GET /movies devuelve películas con IDs de MongoDB serializados y CORS', async (t) => {
    const id = new ObjectId();
    const cursor = {
        sort() { return this; },
        limit() { return this; },
        maxTimeMS() { return this; },
        async toArray() { return [{ _id: id, title: 'Película de prueba' }]; },
    };
    const url = await listen(t, { collection: () => ({ find: () => cursor }) });
    const response = await fetch(`${url}/movies`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), '*');
    assert.deepEqual(await response.json(), [{ _id: id.toHexString(), title: 'Película de prueba' }]);
});

test('GET /movies comunica un fallo de MongoDB sin filtrar detalles internos', async (t) => {
    const url = await listen(t, { collection() { throw new Error('detalle privado'); } });
    const response = await fetch(`${url}/movies`);
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
