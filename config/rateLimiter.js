const rateLimit = require('express-rate-limit');

// =================================
// CONFIGURACIÓN DE RATE LIMITERS
// =================================

/**
 * Rate limiter para login
 * Previene ataques de fuerza bruta en el login
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos por ventana
    message: {
        success: false,
        message: 'Demasiados intentos de login. Por favor intenta de nuevo en 15 minutos.',
        error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true, // Retorna info en headers `RateLimit-*`
    legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
});

/**
 * Rate limiter para registro
 * Previene spam de creación de cuentas
 */
const registroLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 registros por hora
    message: {
        success: false,
        message: 'Demasiados registros desde esta IP. Intenta de nuevo en 1 hora.',
        error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter para recuperación de contraseña
 * Previene abuso del sistema de reset de contraseña
 */
const passwordRecoveryLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 intentos por hora
    message: {
        success: false,
        message: 'Demasiados intentos de recuperación de contraseña. Intenta de nuevo en 1 hora.',
        error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter para cambio de contraseña
 * Previene cambios masivos de contraseña
 */
const passwordChangeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 intentos por hora
    message: {
        success: false,
        message: 'Demasiados intentos de cambio de contraseña. Intenta de nuevo en 1 hora.',
        error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter para eliminación de cuenta
 * Previene eliminaciones accidentales o maliciosas
 */
const deleteAccountLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 horas
    max: 2, // 2 intentos por día
    message: {
        success: false,
        message: 'Demasiados intentos de eliminación de cuenta. Intenta de nuevo mañana.',
        error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter general para endpoints de autenticación
 * Protección general contra abuso
 */
const authGeneralLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20, // 20 requests por ventana
    message: {
        success: false,
        message: 'Demasiadas peticiones. Intenta de nuevo más tarde.',
        error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    loginLimiter,
    registroLimiter,
    passwordRecoveryLimiter,
    passwordChangeLimiter,
    deleteAccountLimiter,
    authGeneralLimiter
};
