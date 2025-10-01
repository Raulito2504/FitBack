const { Pool } = require('pg');
require('dotenv').config();

// Configuración del pool de conexiones
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    max: 20, // Máximo número de conexiones en el pool
    idleTimeoutMillis: 30000, // Tiempo de espera antes de cerrar conexiones inactivas
    connectionTimeoutMillis: 2000, // Tiempo de espera para obtener conexión
});

// Función para conectar a la base de datos
const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Conexión exitosa a PostgreSQL');
        console.log(`📊 Base de datos: ${process.env.DB_NAME}`);
        console.log(`🌐 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Error conectando a la base de datos:', error.message);
        return false;
    }
};

// Función para realizar consultas
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('🔍 Query ejecutada:', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('❌ Error en query:', error.message);
        throw error;
    }
};

// Función para obtener un cliente del pool
const getClient = async () => {
    try {
        const client = await pool.connect();
        return client;
    } catch (error) {
        console.error('❌ Error obteniendo cliente:', error.message);
        throw error;
    }
};

// Función para cerrar el pool
const closePool = async () => {
    try {
        await pool.end();
        console.log('🔒 Pool de conexiones cerrado');
    } catch (error) {
        console.error('❌ Error cerrando pool:', error.message);
    }
};

module.exports = {
    pool,
    connectDB,
    query,
    getClient,
    closePool
};