const Joi = require("joi")

class UsuariosMiddleware {
  // =================================
  // VALIDACIONES DE PERFIL
  // =================================

  // Validar cambio de contraseña
  static async validarCambioPassword(req, res, next) {
    try {
      const schema = Joi.object({
        passwordActual: Joi.string().min(1).required().messages({
          "string.min": "La contraseña actual es requerida",
          "any.required": "La contraseña actual es requerida",
        }),
        passwordNueva: Joi.string()
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
      // Verificar que la nueva contraseña sea diferente a la actual
      if (value.passwordActual === value.passwordNueva) {
        return res.status(400).json({
          success: false,
          message: "La nueva contraseña debe ser diferente a la actual",
        })
      }
      req.body = value
      next()
    } catch (error) {
      console.error("Error en validarCambioPassword:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      })
    }
  }
  // Validar completar perfil
  static async validarCompletarPerfil(req, res, next) {
    try {
      const schema = Joi.object({
        edad: Joi.number().integer().min(18).max(100).required().messages({
          "number.min": "Debe ser mayor de 18 años",
          "number.max": "La edad debe ser menor de 100 años",
          "any.required": "La edad es requerida",
        }),
        altura_cm: Joi.number().min(100).max(250).precision(1).required().messages({
          "number.min": "La estatura debe ser al menos 100 cm",
          "number.max": "La estatura no puede ser mayor a 250 cm",
          "any.required": "La estatura es requerida",
        }),
        sexo: Joi.boolean().required().messages({
          "boolean.base": "El sexo debe ser un valor booleano (true para masculino, false para femenino)",
          "any.required": "El sexo es requerido",
        }),
        peso_actual: Joi.number().min(30).max(150).precision(2).required().messages({
          "number.min": "El peso actual debe ser al menos 30 kg",
          "number.max": "El peso actual no puede ser mayor a 150 kg",
          "any.required": "El peso actual es requerido",
        }),
        peso_deseado: Joi.number().min(30).max(150).precision(2).required().messages({
          "number.min": "El peso deseado debe ser al menos 30 kg",
          "number.max": "El peso deseado no puede ser mayor a 150 kg",
          "any.required": "El peso deseado es requerido",
        }),
        objetivo: Joi.string().valid("bajar peso", "mantener", "tonificar").required().messages({
          "any.only": "El objetivo debe ser 'bajar peso', 'mantener' o 'tonificar'",
          "any.required": "El objetivo es requerido",
        }),
      })
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false,
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
      console.error("Error en validarCompletarPerfil:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      })
    }
  }

  // Validar actualización parcial de perfil (campos opcionales)
  static async validarActualizacionPerfil(req, res, next) {
    try {
      const schema = Joi.object({
        edad: Joi.number().integer().min(18).max(100).optional().messages({
          "number.min": "Debe ser mayor de 18 años",
          "number.max": "La edad debe ser menor de 100 años",
        }),
        altura_cm: Joi.number().min(100).max(250).precision(1).optional().messages({
          "number.min": "La estatura debe ser al menos 100 cm",
          "number.max": "La estatura no puede ser mayor a 250 cm",
        }),
        sexo: Joi.boolean().optional().messages({
          "boolean.base": "El sexo debe ser un valor booleano (true para masculino, false para femenino)",
        }),
        peso_actual: Joi.number().min(30).max(150).precision(2).optional().messages({
          "number.min": "El peso actual debe ser al menos 30 kg",
          "number.max": "El peso actual no puede ser mayor a 150 kg",
        }),
        peso_deseado: Joi.number().min(30).max(150).precision(2).optional().messages({
          "number.min": "El peso deseado debe ser al menos 30 kg",
          "number.max": "El peso deseado no puede ser mayor a 150 kg",
        }),
        objetivo: Joi.string().valid("bajar peso", "mantener", "tonificar").optional().messages({
          "any.only": "El objetivo debe ser 'bajar peso', 'mantener' o 'tonificar'",
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

      // Verificar que al menos un campo esté presente
      if (Object.keys(value).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Debe proporcionar al menos un campo para actualizar",
        })
      }

      req.body = value
      next()
    } catch (error) {
      console.error("Error en validarActualizacionPerfil:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      })
    }
  }

  // =================================
  // VALIDACIONES DE CONSULTA
  // =================================

  // Validar parámetros de paginación
  static async validarPaginacion(req, res, next) {
    try {
      const schema = Joi.object({
        pagina: Joi.number().integer().min(1).default(1).messages({
          "number.base": "La página debe ser un número",
          "number.integer": "La página debe ser un número entero",
          "number.min": "La página debe ser mayor a 0",
        }),
        limite: Joi.number().integer().min(1).max(100).default(50).messages({
          "number.base": "El límite debe ser un número",
          "number.integer": "El límite debe ser un número entero",
          "number.min": "El límite debe ser mayor a 0",
          "number.max": "El límite no puede ser mayor a 100",
        }),
      })
      const { error, value } = schema.validate(req.query)
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Parámetros de consulta inválidos",
          error: error.details[0].message,
        })
      }
      req.query = value
      next()
    } catch (error) {
      console.error("Error en validarPaginacion:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      })
    }
  }
  // Validar ID de usuario
  static async validarIdUsuario(req, res, next) {
    try {
      const schema = Joi.object({
        id: Joi.number().integer().positive().required().messages({
          "number.base": "El ID debe ser un número",
          "number.integer": "El ID debe ser un número entero",
          "number.positive": "El ID debe ser un número positivo",
          "any.required": "El ID es requerido",
        }),
      })
      const { error, value } = schema.validate(req.params)
      if (error) {
        return res.status(400).json({
          success: false,
          message: "ID de usuario inválido",
          error: error.details[0].message,
        })
      }
      req.params = value
      next()
    } catch (error) {
      console.error("Error en validarIdUsuario:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      })
    }
  }
}

module.exports = UsuariosMiddleware
