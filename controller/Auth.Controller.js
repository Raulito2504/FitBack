const AuthModel = require("../model/Auth.Model")
const jwt = require("jsonwebtoken")
const { v4: uuidv4 } = require("uuid")

class AuthController {
  // REGISTRO Y LOGIN

  // => REGISTRAR USUARIO
  static async registrarUsuario(req, res) {
    try {
      const { email, password, usuario } = req.body
      if (!email || !password || !usuario) {
        return res.status(400).json({
          success: false,
          message: "Faltan campos requeridos",
          errores: [
            { campo: "email", mensaje: "El email es requerido" },
            { campo: "password", mensaje: "La contraseña es requerida" },
            { campo: "usuario", mensaje: "El nombre de usuario es requerido" },
          ].filter((e) => !req.body[e.campo]),
        })
      }
      // => Verifica el mail
      const usuarioExistente = await AuthModel.buscarUsuarioPorEmail(email)
      if (usuarioExistente) {
        return res.status(400).json({
          success: false,
          message: "El email ya está registrado",
        })
      }
      // Verificar si el username ya existe
      const usernameExistente = await AuthModel.buscarUsuarioPorUsername(usuario)
      if (usernameExistente) {
        return res.status(400).json({
          success: false,
          message: "El nombre de usuario ya está en uso",
        })
      }
      const nuevoUsuario = await AuthModel.crearUsuario({
        email,
        password,
        usuario,
      })
      // Generar JWT
      const token = jwt.sign(
        {
          id: nuevoUsuario.id,
          email: nuevoUsuario.email,
          usuario: nuevoUsuario.usuario,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN },
      )
      res.status(201).json({
        success: true,
        message: "Usuario registrado exitosamente",
        data: {
          usuario: nuevoUsuario,
          token,
          expiresIn: process.env.JWT_EXPIRES_IN,
        },
      })
    } catch (error) {
      console.error("Error en registrarUsuario:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }
  // Login de usuario
  static async loginUsuario(req, res) {
    try {
      const { email, password } = req.body
      // Buscar usuario por email
      const usuario = await AuthModel.buscarUsuarioPorEmail(email)
      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        })
      }
      // Verificar contraseña
      const passwordValida = await AuthModel.verificarPassword(password, usuario.hash_contrasena)
      if (!passwordValida) {
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        })
      }
      // Actualizar última actividad
      await AuthModel.actualizarUltimaActividad(usuario.id)
      // Generar JWT
      const token = jwt.sign(
        {
          id: usuario.id,
          email: usuario.email,
          usuario: usuario.usuario,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN },
      )
      // Remover datos sensibles
      const { hash_contrasena, ...usuarioSinPassword } = usuario
      res.status(200).json({
        success: true,
        message: "Login exitoso",
        data: {
          usuario: usuarioSinPassword,
          token,
          expiresIn: process.env.JWT_EXPIRES_IN,
        },
      })
    } catch (error) {
      console.error("Error en loginUsuario:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }
  // Logout de usuario
  static async logoutUsuario(req, res) {
    try {
      res.status(200).json({
        success: true,
        message: "Logout exitoso",
        data: {
          message: "Sesión cerrada correctamente",
        },
      })
    } catch (error) {
      console.error("Error en logoutUsuario:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }
  // =================================
  // GESTIÓN DE TOKENS
  // =================================
  // Refresh token
  static async refreshToken(req, res) {
    try {
      const usuario = await AuthModel.buscarPorId(req.usuario.id)
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        })
      }
      // Generar nuevo token
      const nuevoToken = jwt.sign(
        {
          id: usuario.id,
          email: usuario.email,
          usuario: usuario.usuario,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN },
      )
      // Actualizar última actividad
      await AuthModel.actualizarUltimaActividad(usuario.id)
      res.status(200).json({
        success: true,
        message: "Token renovado exitosamente",
        data: {
          token: nuevoToken,
          expiresIn: process.env.JWT_EXPIRES_IN,
        },
      })
    } catch (error) {
      console.error("Error en refreshToken:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }
  // Verificar si el token sigue siendo válido
  static async verificarToken(req, res) {
    try {
      const usuario = await AuthModel.buscarPorId(req.usuario.id)
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        })
      }
      res.status(200).json({
        success: true,
        message: "Token válido",
        data: {
          id: usuario.id,
          email: usuario.email,
          username: usuario.usuario,
          tokenInfo: {
            isValid: true,
            expiresIn: process.env.JWT_EXPIRES_IN,
          },
        },
      })
    } catch (error) {
      console.error("Error en verificarToken:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }
  // =================================
  // RECUPERACIÓN DE CONTRASEÑA
  // =================================
  // Solicitar reset de contraseña
  static async solicitarResetPassword(req, res) {
    try {
      const { email } = req.body
      const usuario = await AuthModel.buscarUsuarioPorEmail(email)
      res.status(200).json({
        success: true,
        message: "Si el email existe, recibirás instrucciones para resetear tu contraseña",
        data: {
          // En una implementación real, aquí se enviaría un email
          info: "Funcionalidad de reset de contraseña pendiente de implementar",
        },
      })
    } catch (error) {
      console.error("Error en solicitarResetPassword:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }
  // Reset de contraseña con token
  static async resetPassword(req, res) {
    try {
      const { token, nuevaPassword } = req.body
      res.status(200).json({
        success: true,
        message: "Funcionalidad de reset de contraseña pendiente de implementar",
      })
    } catch (error) {
      console.error("Error en resetPassword:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }
  // =================================
  // VERIFICACIÓN DE EMAIL
  // =================================
  // Verificar email con token
  static async verificarEmail(req, res) {
    try {
      const { token } = req.params
      // Implementar lógica de verificación de email
      res.status(200).json({
        success: true,
        message: "Funcionalidad de verificación de email pendiente de implementar",
      })
    } catch (error) {
      console.error("Error en verificarEmail:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }
  // Reenviar email de verificación
  static async reenviarVerificacion(req, res) {
    try {
      const usuario = await AuthModel.buscarPorId(req.usuario.id)
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        })
      }
      if (usuario.email_verificado) {
        return res.status(400).json({
          success: false,
          message: "El email ya está verificado",
        })
      }
      // Implementar lógica de reenvío de email
      res.status(200).json({
        success: true,
        message: "Email de verificación reenviado (funcionalidad pendiente de implementar)",
      })
    } catch (error) {
      console.error("Error en reenviarVerificacion:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }

  // =================================
  // VALIDACIONES DE DISPONIBILIDAD
  // =================================

  // Verificar disponibilidad de email
  static async verificarEmailDisponible(req, res) {
    try {
      const { email } = req.body
      const disponible = await AuthModel.emailDisponible(email)
      res.status(200).json({
        success: true,
        message: disponible ? "Email disponible" : "Email ya registrado",
        data: {
          disponible,
          email: email,
        },
      })
    } catch (error) {
      console.error("Error en verificarEmailDisponible:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }
  // Verificar disponibilidad de username
  static async verificarUsernameDisponible(req, res) {
    try {
      const { usuario } = req.body
      const disponible = await AuthModel.usernameDisponible(usuario)
      res.status(200).json({
        success: true,
        message: disponible ? "Username disponible" : "Username ya en uso",
        data: {
          disponible,
          usuario: usuario,
        },
      })
    } catch (error) {
      console.error("Error en verificarUsernameDisponible:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }
}

module.exports = AuthController
