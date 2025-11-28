const express = require('express');
const router = express.Router();

// Importar controladores y middlewares de autenticación
const authController = require('../controller/Auth.Controller');
const authMiddleware = require('../middleware/Auth.Middleware');

// =================================
// RUTAS DE AUTENTICACIÓN
// =================================

// Registro de usuario
router.post('/registro',
    authMiddleware.validarRegistro,
    authController.registrarUsuario
);

// Login de usuario
router.post('/login',
    authMiddleware.validarLogin,
    authController.loginUsuario
);

// Logout (invalidar token)
router.post('/logout',
    authMiddleware.verificarToken,
    authController.logoutUsuario
);

// Refresh token
router.post('/refresh-token',
    authMiddleware.verificarToken,
    authController.refreshToken
);

// Verificar token (validar si el token sigue siendo válido)
router.get('/verificar-token',
    authMiddleware.verificarToken,
    authController.verificarToken
);

// =================================
// RECUPERACIÓN DE CONTRASEÑA
// =================================

// Solicitar reset de contraseña
router.post('/forgot-password',
    authMiddleware.validarEmail,
    authController.solicitarResetPassword
);

// Resetear contraseña con token
router.post('/reset-password',
    authMiddleware.validarResetPassword,
    authController.resetPassword
);

// =================================
// VERIFICACIÓN DE EMAIL
// =================================

// Verificar email con token
router.get('/verificar-email/:token',
    authController.verificarEmail
);

// Reenviar email de verificación
router.post('/reenviar-verificacion',
    authMiddleware.verificarToken,
    authController.reenviarVerificacion
);

// =================================
// VALIDACIÓN DE DISPONIBILIDAD
// =================================

// Verificar disponibilidad de email
router.post('/verificar-email-disponible',
    authMiddleware.validarEmail,
    authController.verificarEmailDisponible
);

// Verificar disponibilidad de nombre de usuario
router.post('/verificar-username-disponible',
    authMiddleware.validarUsername,
    authController.verificarUsernameDisponible
);

module.exports = router;
