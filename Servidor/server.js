const { loadEnvFile } = require('node:process');
const path = require('node:path');
const { MongoClient } = require('mongodb');
const { createApp } = require('./app');

async function startServer() {
    try {
        loadEnvFile(path.join(__dirname, '.env'));
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('Falta MONGODB_URI. Copia .env.example a .env y configura tu conexión a MongoDB.');
    }
    const port = Number(process.env.PORT || 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('PORT debe ser un número entre 1 y 65535.');
    }

    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
    try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB || 'sample_mflix');
        await db.command({ ping: 1 });
        const app = createApp(db);
        const server = await new Promise((resolve, reject) => {
            const listener = app.listen(port, '0.0.0.0', () => resolve(listener));
            listener.once('error', reject);
        });
        console.log(`Conectado a MongoDB. Servidor disponible en http://localhost:${port}`);

        let closing = false;
        function shutdown() {
            if (closing) return;
            closing = true;
            server.closeAllConnections();
            server.close(async () => {
                await client.close();
            });
        }
        process.once('SIGINT', shutdown);
        process.once('SIGTERM', shutdown);
        return { server, client };
    } catch (error) {
        await client.close();
        throw error;
    }
}

if (require.main === module) {
    startServer().catch((error) => {
        // No imprimir la URI: puede contener credenciales.
        if (error.code === 'EADDRINUSE') {
            console.error('El puerto está ocupado. Cambia PORT en .env o detén el otro servidor.');
        } else if (error.name?.startsWith('Mongo')) {
            console.error('No se pudo conectar a MongoDB. Revisa MONGODB_URI, las credenciales y el acceso de red en Atlas.');
        } else {
            console.error(error.message);
        }
        process.exitCode = 1;
    });
}

module.exports = { startServer };
