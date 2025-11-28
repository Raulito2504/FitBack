const jwt = require("jsonwebtoken")
const Joi = require("joi")
const validator = require("validator")
class AuthMiddleware {
  // =================================
  // AUTENTICACIÓN Y AUTORIZACIÓN
  // =================================
  // Verificar token JWT
  static async verificarToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Token de acceso requerido",
          error: "NO_TOKEN",
        })
      }
      const token = authHeader.substring(7) // Remover 'Bearer '
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.usuario = decoded
        next()
      } catch (jwtError) {
        let errorMessage = "Token inválido"
        let errorCode = "INVALID_TOKEN"
        if (jwtError.name === "TokenExpiredError") {
          errorMessage = "Token expirado"
          errorCode = "TOKEN_EXPIRED"
        } else if (jwtError.name === "JsonWebTokenError") {
          errorMessage = "Token malformado"
          errorCode = "MALFORMED_TOKEN"
        }
        return res.status(401).json({
          success: false,
          message: errorMessage,
          error: errorCode,
        })
      }
    } catch (error) {
      console.error("Error en verificarToken:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: "INTERNAL_ERROR",
      })
    }
  }

  // Verificar si es administrador (placeholder)
  static async verificarAdmin(req, res, next) {
    try {
      // Por ahora, asumir que todos los usuarios pueden acceder
      // En el futuro, implementar lógica de roles
      next()
    } catch (error) {
      console.error("Error en verificarAdmin:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      })
    }
  }
  // =================================
  // VALIDACIONES DE REGISTRO
  // =================================
  // Validar datos de registro
  static async validarRegistro(req, res, next) {
    try {
      const schema = Joi.object({
        email: Joi.string().email().max(320).required().messages({
          "string.email": "Formato de email inválido",
          "string.max": "Email demasiado largo (máximo 320 caracteres)",
          "any.required": "El email es requerido",
        }),
        password: Joi.string()
          .min(8)
          .max(128)
          .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
          .required()
          .messages({
            "string.min": "La contraseña debe tener al menos 8 caracteres",
            "string.max": "La contraseña es demasiado larga (máximo 128 caracteres)",
            "string.pattern.base":
              "La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial (@, $, !, %, *, ?, &)",
            "any.required": "La contraseña es requerida",
          }),
        usuario: Joi.string().alphanum().min(3).max(60).required().messages({
          "string.alphanum": "El nombre de usuario solo puede contener letras y números",
          "string.min": "El nombre de usuario debe tener al menos 3 caracteres",
          "string.max": "El nombre de usuario es demasiado largo (máximo 60 caracteres)",
          "any.required": "El nombre de usuario es requerido",
        }),
      })
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      })
      if (error) {
        const errores = error.details.map((detalle) => ({
          campo: detalle.path[0],
          mensaje: detalle.message,
          valorRecibido: detalle.context?.value,
        }))
        return res.status(400).json({
          success: false,
          message: "Datos de entrada inválidos",
          errores,
        })
      }
      req.body = value
      next()
    } catch (error) {
      console.error("Error en validarRegistro:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      })
    }
  }
  // =================================
  // VALIDACIONES DE LOGIN
  // =================================

  // Validar datos de login
  static async validarLogin(req, res, next) {
    try {
      const schema = Joi.object({
        email: Joi.string().email().required().messages({
          "string.email": "Formato de email inválido",
          "any.required": "El email es requerido",
        }),
        password: Joi.string().min(1).required().messages({
          "string.min": "La contraseña es requerida",
          "any.required": "La contraseña es requerida",
        }),
      })
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      })
      if (error) {
        const errores = error.details.map((detalle) => ({
          campo: detalle.path[0],
          mensaje: detalle.message,
        }))
        return res.status(400).json({
          success: false,
          message: "Datos de entrada inválidos",
          errores,
        })
      }
      req.body = value
      next()
    } catch (error) {
      console.error("Error en validarLogin:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      })
    }
  }
  // =================================
  // VALIDACIONES DE RECUPERACIÓN
  // =================================
  // Validar reset de contraseña
  static async validarResetPassword(req, res, next) {
    try {
      const schema = Joi.object({
        token: Joi.string().required().messages({
          "any.required": "El token es requerido",
        }),
        nuevaPassword: Joi.string()
          .min(8)
          .max(128)
          .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&].*$/)
          .required()
          .messages({
            "string.min": "La nueva contraseña debe tener al menos 8 caracteres",
            "string.max": "La nueva contraseña es demasiado larga (máximo 128 caracteres)",
            "string.pattern.base":
              "La nueva contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial",
            "any.required": "La nueva contraseña es requerida",
          }),
      })
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      })
      if (error) {
        const errores = error.details.map((detalle) => ({
          campo: detalle.path[0],
          mensaje: detalle.message,
        }))
        return res.status(400).json({
          success: false,
          message: "Datos de entrada inválidos",
          errores,
        })
      }
      req.body = value
      next()
    } catch (error) {
      console.error("Error en validarResetPassword:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      })
    }
  }

  // =================================
  // VALIDACIONES INDIVIDUALES
  // =================================
  // Validar email
  static async validarEmail(req, res, next) {
    try {
      const schema = Joi.object({
        email: Joi.string().email().max(320).required().messages({
          "string.email": "Formato de email inválido",
          "string.max": "Email demasiado largo (máximo 320 caracteres)",
          "any.required": "El email es requerido",
        }),
      })
      const { error, value } = schema.validate(req.body)
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
          error: "VALIDATION_ERROR",
        })
      }
      req.body = value
      next()
    } catch (error) {
      console.error("Error en validarEmail:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      })
    }
  }
  // Validar username
  static async validarUsername(req, res, next) {
    try {
      const schema = Joi.object({
        usuario: Joi.string().alphanum().min(3).max(60).required().messages({
          "string.alphanum": "El nombre de usuario solo puede contener letras y números",
          "string.min": "El nombre de usuario debe tener al menos 3 caracteres",
          "string.max": "El nombre de usuario es demasiado largo (máximo 60 caracteres)",
          "any.required": "El nombre de usuario es requerido",
        }),
      })
      const { error, value } = schema.validate(req.body)
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
          error: "VALIDATION_ERROR",
        })
      }
      req.body = value
      next()
    } catch (error) {
      console.error("Error en validarUsername:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      })
    }
  }
}

module.exports = AuthMiddleware
