/**
 * Utilidades para la conexión y manejo de la base de datos MongoDB
 */

const mongoose = require('mongoose');

/**
 * Configura y establece la conexión a MongoDB
 * @param {string} mongoURI - URI de conexión a MongoDB
 */
const connectDatabase = async (mongoURI) => {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Conexión a MongoDB establecida con éxito');
    } catch (error) {
        console.error('❌ Error en la conexión a MongoDB:', error);
        process.exit(1);
    }
};

/**
 * Maneja los eventos de conexión de MongoDB
 */
const setupDatabaseEvents = () => {
    mongoose.connection.on('connected', () => {
        console.log('✅ Conectado a MongoDB');
    });

    mongoose.connection.on('error', (err) => {
        console.error('❌ Error en la conexión a MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('⚠️ Desconectado de MongoDB');
    });
};

/**
 * Cierra la conexión a MongoDB de forma segura
 */
const closeDatabase = async () => {
    try {
        await mongoose.connection.close();
        console.log('✅ Conexión a MongoDB cerrada');
    } catch (error) {
        console.error('❌ Error al cerrar la conexión a MongoDB:', error);
    }
};

module.exports = {
    connectDatabase,
    setupDatabaseEvents,
    closeDatabase
};
