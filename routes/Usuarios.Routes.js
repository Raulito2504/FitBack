const express = require("express")
const router = express.Router()

// Importar controladores y middlewares
const usuariosController = require("../controller/Usuarios.Controller")
const usuariosMiddleware = require("../middleware/Usuarios.Middleware")
const authMiddleware = require("../middleware/Auth.Middleware")

// =================================
// RUTAS DE PERFIL (requieren autenticación)
// =================================

// Obtener perfil del usuario actual
router.get("/perfil", authMiddleware.verificarToken, usuariosController.obtenerPerfil)

// Actualizar perfil del usuario
router.put(
  "/perfil",
  authMiddleware.verificarToken,
  usuariosController.actualizarPerfil,
)

// Completar perfil del usuario
router.put(
  "/completar-perfil",
  authMiddleware.verificarToken,
  usuariosMiddleware.validarCompletarPerfil,
  usuariosController.completarPerfilProgresivo,
)

// Cambiar contraseña
router.put(
  "/cambiar-password",
  authMiddleware.verificarToken,
  usuariosMiddleware.validarCambioPassword,
  usuariosController.cambiarPassword,
)

// Eliminar cuenta
router.delete("/eliminar-cuenta", authMiddleware.verificarToken, usuariosController.eliminarCuenta)

// Obtener estadísticas del usuario
router.get("/estadisticas", authMiddleware.verificarToken, usuariosController.obtenerEstadisticasUsuario)

// =================================
// RUTAS ADMINISTRATIVAS
// =================================

// Obtener todos los usuarios (solo admin)
router.get("/", authMiddleware.verificarToken, authMiddleware.verificarAdmin, usuariosController.obtenerTodosUsuarios)

// Obtener usuario por ID (solo admin)
router.get("/:id", authMiddleware.verificarToken, authMiddleware.verificarAdmin, usuariosController.obtenerUsuarioPorId)

module.exports = router
