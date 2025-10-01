const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Importar configuración de CORS
const corsConfig = require('./config/cors');

// Importar rutas
const usuariosRoutes = require('./routes/Usuarios.Routes');
const authRoutes = require('./routes/Auth.Route');

// Crear aplicación Express
const app = express();

// =================================
// MIDDLEWARES GLOBALES
// =================================

// Seguridad HTTP headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
app.use(cors(corsConfig));

// Compresión de respuestas
app.use(compression());

// Logging de requests
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Parseo de JSON
app.use(express.json({
    limit: '10mb',
    strict: true
}));

// Parseo de URL encoded
app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
}));

// =================================
// RUTAS PRINCIPALES
// =================================

// Ruta de salud/ping
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'FitBack API funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: '1.0.0'
    });
});

// Ruta principal
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Bienvenido a FitBack API',
        documentation: '/api/health',
        endpoints: {
            auth: '/api/auth',
            usuarios: '/api/usuarios',
            health: '/api/health'
        }
    });
});

// =================================
// RUTAS DE LA API
// =================================

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de usuarios
app.use('/api/usuarios', usuariosRoutes);

// =================================
// MANEJO DE ERRORES
// =================================

// Ruta no encontrada (404)
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Ruta ${req.originalUrl} no encontrada`,
        availableEndpoints: {
            root: '/',
            health: '/api/health',
            auth: '/api/auth',
            usuarios: '/api/usuarios'
        }
    });
});

// Manejo global de errores
app.use((error, req, res, next) => {
    console.error('❌ Error global capturado:', error.message);
    console.error(error.stack);

    // Error de sintaxis JSON
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({
            success: false,
            message: 'JSON malformado en el cuerpo de la petición',
            error: 'Syntax Error'
        });
    }

    // Error de payload muy grande
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            message: 'El archivo es demasiado grande',
            error: 'Payload Too Large'
        });
    }

    // Error genérico del servidor
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

module.exports = app;