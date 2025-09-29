require('dotenv').config();
const app = require('./app');
const { connectDB, closePool } = require('./config/database.config');

const PORT = process.env.PORT || 5005;

// Función para iniciar el servidor
const startServer = async () => {
    try {
        // Intentar conectar a la base de datos
        const dbConnected = await connectDB();

        if (!dbConnected) {
            console.error('❌ No se pudo conectar a la base de datos. Cerrando servidor...');
            process.exit(1);
        }

        // Iniciar el servidor
        const server = app.listen(PORT, () => {
            console.log('🚀 =================================');
            console.log('🚀 Servidor FitBack iniciado exitosamente');
            console.log('🚀 =================================');
            console.log(`🌐 Entorno: ${process.env.NODE_ENV}`);
            console.log(`📡 Puerto: ${PORT}`);
            console.log(`🔗 URL: http://localhost:${PORT}`);
            console.log(`🎯 CORS habilitado para: ${process.env.FRONTEND_URL}`);
            console.log('🚀 =================================');
        });

        // Manejo de errores del servidor
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Puerto ${PORT} ya está en uso`);
            } else {
                console.error('❌ Error del servidor:', error.message);
            }
            process.exit(1);
        });

        // Manejo de señales de cierre
        const gracefulShutdown = async (signal) => {
            console.log(`\n⚠️  Señal ${signal} recibida. Cerrando servidor...`);

            server.close(async () => {
                console.log('🔒 Servidor HTTP cerrado');

                // Cerrar conexiones de base de datos
                await closePool();

                console.log('✅ Cierre exitoso del servidor');
                process.exit(0);
            });

            // Forzar cierre después de 10 segundos
            setTimeout(() => {
                console.error('❌ Forzando cierre del servidor');
                process.exit(1);
            }, 10000);
        };

        // Escuchar señales de cierre
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        console.error('❌ Error fatal iniciando servidor:', error.message);
        process.exit(1);
    }
};

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Excepción no capturada:', error.message);
    console.error(error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
    console.error('En:', promise);
    process.exit(1);
});

// Iniciar el servidor
startServer();