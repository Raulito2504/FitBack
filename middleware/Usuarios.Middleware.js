const Joi = require('joi');

class UsuariosMiddleware {

    // =================================
    // VALIDACIONES DE PERFIL
    // =================================

    // Validar actualización de perfil
    static async validarActualizacionPerfil(req, res, next) {
        try {
            const schema = Joi.object({
                nombre_completo: Joi.string()
                    .min(2)
                    .max(150)
                    .pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
                    .messages({
                        'string.min': 'El nombre completo debe tener al menos 2 caracteres',
                        'string.max': 'El nombre completo es demasiado largo (máximo 150 caracteres)',
                        'string.pattern.base': 'El nombre completo solo puede contener letras y espacios'
                    }),

                telefono: Joi.string()
                    .pattern(/^[+]?[0-9\s()-]{10,20}$/)
                    .allow('', null)
                    .messages({
                        'string.pattern.base': 'Formato de teléfono inválido'
                    }),

                fecha_nacimiento: Joi.date()
                    .max('now')
                    .messages({
                        'date.max': 'La fecha de nacimiento no puede ser futura'
                    })
            }).min(1); // Al menos un campo debe estar presente

            const { error, value } = schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true,
                allowUnknown: false
            });

            if (error) {
                const errores = error.details.map(detalle => ({
                    campo: detalle.path[0],
                    mensaje: detalle.message,
                    valorRecibido: detalle.context?.value
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errores
                });
            }

            if (Object.keys(value).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar al menos un campo para actualizar'
                });
            }

            // Validación adicional de edad si se proporciona fecha_nacimiento
            if (value.fecha_nacimiento) {
                const fechaNacimiento = new Date(value.fecha_nacimiento);
                const fechaMinima = new Date();
                fechaMinima.setFullYear(fechaMinima.getFullYear() - 13);

                if (fechaNacimiento > fechaMinima) {
                    return res.status(400).json({
                        success: false,
                        message: 'Debe ser mayor de 13 años',
                        error: 'AGE_RESTRICTION'
                    });
                }
            }

            req.body = value;
            next();

        } catch (error) {
            console.error('Error en validarActualizacionPerfil:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Validar cambio de contraseña
    static async validarCambioPassword(req, res, next) {
        try {
            const schema = Joi.object({
                passwordActual: Joi.string()
                    .min(1)
                    .required()
                    .messages({
                        'string.min': 'La contraseña actual es requerida',
                        'any.required': 'La contraseña actual es requerida'
                    }),

                passwordNueva: Joi.string()
                    .min(8)
                    .max(128)
                    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&].*$/)
                    .required()
                    .messages({
                        'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
                        'string.max': 'La nueva contraseña es demasiado larga (máximo 128 caracteres)',
                        'string.pattern.base': 'La nueva contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial',
                        'any.required': 'La nueva contraseña es requerida'
                    })
            });

            const { error, value } = schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true
            });

            if (error) {
                const errores = error.details.map(detalle => ({
                    campo: detalle.path[0],
                    mensaje: detalle.message
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errores
                });
            }

            // Verificar que la nueva contraseña sea diferente a la actual
            if (value.passwordActual === value.passwordNueva) {
                return res.status(400).json({
                    success: false,
                    message: 'La nueva contraseña debe ser diferente a la actual'
                });
            }

            req.body = value;
            next();

        } catch (error) {
            console.error('Error en validarCambioPassword:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // =================================
    // VALIDACIONES DE CONSULTA
    // =================================

    // Validar parámetros de paginación
    static async validarPaginacion(req, res, next) {
        try {
            const schema = Joi.object({
                pagina: Joi.number()
                    .integer()
                    .min(1)
                    .default(1)
                    .messages({
                        'number.base': 'La página debe ser un número',
                        'number.integer': 'La página debe ser un número entero',
                        'number.min': 'La página debe ser mayor a 0'
                    }),

                limite: Joi.number()
                    .integer()
                    .min(1)
                    .max(100)
                    .default(50)
                    .messages({
                        'number.base': 'El límite debe ser un número',
                        'number.integer': 'El límite debe ser un número entero',
                        'number.min': 'El límite debe ser mayor a 0',
                        'number.max': 'El límite no puede ser mayor a 100'
                    })
            });

            const { error, value } = schema.validate(req.query);

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetros de consulta inválidos',
                    error: error.details[0].message
                });
            }

            req.query = value;
            next();

        } catch (error) {
            console.error('Error en validarPaginacion:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Validar ID de usuario
    static async validarIdUsuario(req, res, next) {
        try {
            const schema = Joi.object({
                id: Joi.number()
                    .integer()
                    .positive()
                    .required()
                    .messages({
                        'number.base': 'El ID debe ser un número',
                        'number.integer': 'El ID debe ser un número entero',
                        'number.positive': 'El ID debe ser un número positivo',
                        'any.required': 'El ID es requerido'
                    })
            });

            const { error, value } = schema.validate(req.params);

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario inválido',
                    error: error.details[0].message
                });
            }

            req.params = value;
            next();

        } catch (error) {
            console.error('Error en validarIdUsuario:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = UsuariosMiddleware;