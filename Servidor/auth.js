const { MongoClient } = require('mongodb');

function createAtlasAuthenticator(uri, databaseName) {
    const address = new URL(uri);
    address.username = '';
    address.password = '';
    return async (username, password) => {
        const client = new MongoClient(address.toString(), {
            auth: { username, password },
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 1,
        });
        try {
            await client.connect();
            // También verifica el permiso de lectura sobre el catálogo.
            await client.db(databaseName).collection('movies').findOne({}, { projection: { _id: 1 }, maxTimeMS: 5000 });
        } finally {
            await client.close();
        }
    };
}

module.exports = { createAtlasAuthenticator };
