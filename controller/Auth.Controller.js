const AuthModel = require("../model/Auth.Model")
const jwt = require("jsonwebtoken")

class AuthController {
  // =================================
  // REGISTRO Y LOGIN
  // =================================

  // Registrar nuevo usuario
  static async registrarUsuario(req, res) {
    try {
      const { email, usuario } = req.body

      // Verificar si el email ya existe
      const emailExiste = await AuthModel.buscarUsuarioPorEmail(email)
      if (emailExiste) {
        return res.status(400).json({
          success: false,
          message: "El email ya está registrado",
          error: "EMAIL_EXISTS",
        })
      }

      // Verificar si el username ya existe
      const usernameExiste = await AuthModel.buscarUsuarioPorUsername(usuario)
      if (usernameExiste) {
        return res.status(400).json({
          success: false,
          message: "El nombre de usuario ya está en uso",
          error: "USERNAME_EXISTS",
        })
      }

      // Crear usuario
      const nuevoUsuario = await AuthModel.crearUsuario(req.body)

      // Generar token JWT
      const token = jwt.sign(
        {
          userId: nuevoUsuario.id,
          email: nuevoUsuario.email,
          usuario: nuevoUsuario.usuario,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
      )

      res.status(201).json({
        success: true,
        message: "Usuario registrado exitosamente",
        data: {
          usuario: nuevoUsuario,
          token,
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
          error: "INVALID_CREDENTIALS",
        })
      }

      // Verificar contraseña
      const passwordValida = await AuthModel.verificarPassword(password, usuario.hash_contrasena)

      if (!passwordValida) {
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
          error: "INVALID_CREDENTIALS",
        })
      }

      // Generar token JWT
      const token = jwt.sign(
        {
          userId: usuario.id,
          email: usuario.email,
          usuario: usuario.usuario,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
      )

      // Remover contraseña del objeto usuario
      delete usuario.hash_contrasena

      res.status(200).json({
        success: true,
        message: "Login exitoso",
        data: {
          usuario,
          token,
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
      // En un sistema con tokens JWT, el logout se maneja en el cliente
      // eliminando el token. Aquí solo confirmamos la acción.

      res.status(200).json({
        success: true,
        message: "Logout exitoso",
      })
    } catch (error) {
      console.error("Error en logoutUsuario:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      })
    }
  }

  // =================================
  // GESTIÓN DE TOKENS
  // =================================

  // Refresh token
  static async refreshToken(req, res) {
    try {
      const usuario = await AuthModel.buscarUsuarioPorId(req.usuario.userId)

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
          error: "USER_NOT_FOUND",
        })
      }

      // Generar nuevo token
      const nuevoToken = jwt.sign(
        {
          userId: usuario.id,
          email: usuario.email,
          usuario: usuario.usuario,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
      )

      res.status(200).json({
        success: true,
        message: "Token renovado exitosamente",
        data: { token: nuevoToken },
      })
    } catch (error) {
      console.error("Error en refreshToken:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      })
    }
  }

  // Verificar token
  static async verificarToken(req, res) {
    try {
      const usuario = await AuthModel.buscarUsuarioPorId(req.usuario.userId)

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
          error: "USER_NOT_FOUND",
        })
      }

      res.status(200).json({
        success: true,
        message: "Token válido",
        data: { usuario },
      })
    } catch (error) {
      console.error("Error en verificarToken:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
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

      if (!usuario) {
        // Por seguridad, no revelar si el email existe
        return res.status(200).json({
          success: true,
          message: "Si el email existe, recibirás instrucciones para resetear tu contraseña",
        })
      }

      // Generar token de reset (válido por 1 hora)
      const resetToken = jwt.sign({ userId: usuario.id, tipo: "reset_password" }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      })

      // TODO: Enviar email con el token
      // Por ahora, solo devolver el token (en producción, esto se enviaría por email)

      res.status(200).json({
        success: true,
        message: "Token de reset generado",
        data: { resetToken }, // En producción, esto NO se devolvería en la respuesta
      })
    } catch (error) {
      console.error("Error en solicitarResetPassword:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      })
    }
  }

  // Resetear contraseña con token
  static async resetPassword(req, res) {
    try {
      const { token, nuevaPassword } = req.body

      // Verificar token
      let decoded
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)

        if (decoded.tipo !== "reset_password") {
          throw new Error("Token inválido")
        }
      } catch (jwtError) {
        return res.status(400).json({
          success: false,
          message: "Token inválido o expirado",
          error: "INVALID_TOKEN",
        })
      }

      // Obtener usuario
      const usuario = await AuthModel.buscarUsuarioPorId(decoded.userId)

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        })
      }

      // Cambiar contraseña
      await AuthModel.cambiarPasswordPorEmail(usuario.email, nuevaPassword)

      res.status(200).json({
        success: true,
        message: "Contraseña restablecida exitosamente",
      })
    } catch (error) {
      console.error("Error en resetPassword:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
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

      // Verificar token
      let decoded
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)
      } catch (jwtError) {
        return res.status(400).json({
          success: false,
          message: "Token inválido o expirado",
          error: "INVALID_TOKEN",
        })
      }

      // Verificar email
      const resultado = await AuthModel.verificarEmail(decoded.userId)

      if (!resultado) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        })
      }

      res.status(200).json({
        success: true,
        message: "Email verificado exitosamente",
      })
    } catch (error) {
      console.error("Error en verificarEmail:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      })
    }
  }

  // Reenviar email de verificación
  static async reenviarVerificacion(req, res) {
    try {
      const usuario = await AuthModel.obtenerUsuarioParaVerificacion(req.usuario.userId)

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

      // Generar token de verificación
      const verificationToken = jwt.sign({ userId: usuario.id, tipo: "email_verification" }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      })

      // TODO: Enviar email con el token

      res.status(200).json({
        success: true,
        message: "Email de verificación enviado",
        data: { verificationToken }, // En producción, esto NO se devolvería
      })
    } catch (error) {
      console.error("Error en reenviarVerificacion:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      })
    }
  }

  // =================================
  // VALIDACIÓN DE DISPONIBILIDAD
  // =================================

  // Verificar disponibilidad de email
  static async verificarEmailDisponible(req, res) {
    try {
      const { email } = req.body

      const disponible = await AuthModel.emailDisponible(email)

      res.status(200).json({
        success: true,
        data: { disponible },
      })
    } catch (error) {
      console.error("Error en verificarEmailDisponible:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
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
        data: { disponible },
      })
    } catch (error) {
      console.error("Error en verificarUsernameDisponible:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      })
    }
  }
}

module.exports = AuthController
