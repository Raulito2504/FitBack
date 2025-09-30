const AuthModel = require('../model/Auth.Model');
const EmailService = require('../services/EmailService');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

class AuthController {

    // =================================
    // REGISTRO Y LOGIN
    // =================================

    // Registrar usuario
    static async registrarUsuario(req, res) {
        try {
            const {
                email,
                password,
                nombre_usuario,
                nombre_completo,
                telefono,
                fecha_nacimiento,
                sexo
            } = req.body;

            // Verificar si el email ya existe
            const usuarioExistente = await AuthModel.buscarUsuarioPorEmail(email);
            if (usuarioExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }

            // Verificar si el username ya existe
            const usernameExistente = await AuthModel.buscarUsuarioPorUsername(nombre_usuario);
            if (usernameExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de usuario ya está en uso'
                });
            }

            // Crear usuario
            const nuevoUsuario = await AuthModel.crearUsuario({
                email,
                password,
                nombre_usuario,
                nombre_completo,
                telefono,
                fecha_nacimiento,
                sexo
            });

            // Generar token de verificación de email
            const tokenVerificacion = EmailService.generarToken();
            await AuthModel.crearTokenVerificacion(
                nuevoUsuario.id_usuario,
                tokenVerificacion,
                'email_verification'
            );

            // Enviar email de verificación
            try {
                await EmailService.enviarEmailVerificacion(
                    email,
                    nombre_completo,
                    tokenVerificacion
                );
                console.log('✅ Email de verificación enviado a:', email);
            } catch (emailError) {
                console.error('⚠️ Error enviando email de verificación:', emailError.message);
                // No fallar el registro si falla el email
            }

            // Generar JWT para acceso inmediato (aunque email no esté verificado)
            const token = jwt.sign(
                {
                    userId: nuevoUsuario.id_usuario,
                    email: nuevoUsuario.email,
                    username: nuevoUsuario.nombre_usuario
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente. Revisa tu email para verificar tu cuenta.',
                data: {
                    usuario: nuevoUsuario,
                    token,
                    expiresIn: process.env.JWT_EXPIRES_IN,
                    emailEnviado: true,
                    nota: 'Verifica tu email para activar todas las funcionalidades'
                }
            });

        } catch (error) {
            console.error('Error en registrarUsuario:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Login de usuario
    static async loginUsuario(req, res) {
        try {
            const { email, password } = req.body;

            // Buscar usuario por email
            const usuario = await AuthModel.buscarUsuarioPorEmail(email);
            if (!usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Verificar contraseña
            const passwordValida = await AuthModel.verificarPassword(password, usuario.hash_contrasena);
            if (!passwordValida) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Actualizar última actividad
            await AuthModel.actualizarUltimaActividad(usuario.id_usuario);

            // Generar JWT
            const token = jwt.sign(
                {
                    userId: usuario.id_usuario,
                    email: usuario.email,
                    username: usuario.nombre_usuario,
                    verificado: usuario.email_verificado || false
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            // Remover datos sensibles
            const { hash_contrasena, ...usuarioSinPassword } = usuario;

            res.status(200).json({
                success: true,
                message: 'Login exitoso',
                data: {
                    usuario: usuarioSinPassword,
                    token,
                    expiresIn: process.env.JWT_EXPIRES_IN
                }
            });

        } catch (error) {
            console.error('Error en loginUsuario:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Logout de usuario
    static async logoutUsuario(req, res) {
        try {
            // En una implementación más avanzada, aquí se podría:
            // 1. Invalidar el token en una blacklist
            // 2. Eliminar refresh tokens de la base de datos
            // 3. Limpiar sesiones activas

            res.status(200).json({
                success: true,
                message: 'Logout exitoso',
                data: {
                    message: 'Sesión cerrada correctamente'
                }
            });

        } catch (error) {
            console.error('Error en logoutUsuario:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // =================================
    // GESTIÓN DE TOKENS
    // =================================

    // Refresh token
    static async refreshToken(req, res) {
        try {
            const usuario = await AuthModel.buscarPorId(req.usuario.userId);

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Generar nuevo token
            const nuevoToken = jwt.sign(
                {
                    userId: usuario.id_usuario,
                    email: usuario.email,
                    username: usuario.nombre_usuario
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            // Actualizar última actividad
            await AuthModel.actualizarUltimaActividad(usuario.id_usuario);

            res.status(200).json({
                success: true,
                message: 'Token renovado exitosamente',
                data: {
                    token: nuevoToken,
                    expiresIn: process.env.JWT_EXPIRES_IN
                }
            });

        } catch (error) {
            console.error('Error en refreshToken:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Verificar si el token sigue siendo válido
    static async verificarToken(req, res) {
        try {
            const usuario = await AuthModel.buscarPorId(req.usuario.userId);

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Token válido',
                data: {
                    userId: usuario.id_usuario,
                    email: usuario.email,
                    username: usuario.nombre_usuario,
                    tokenInfo: {
                        isValid: true,
                        expiresIn: process.env.JWT_EXPIRES_IN
                    }
                }
            });

        } catch (error) {
            console.error('Error en verificarToken:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // =================================
    // RECUPERACIÓN DE CONTRASEÑA
    // =================================

    // Solicitar reset de contraseña
    static async solicitarResetPassword(req, res) {
        try {
            const { email } = req.body;

            // Validar entrada
            const { error } = Joi.object({
                email: Joi.string().email().required()
            }).validate({ email });

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Email inválido',
                    details: error.details[0].message
                });
            }

            const usuario = await AuthModel.buscarUsuarioPorEmail(email);

            // Si el usuario existe, enviar email de reset
            if (usuario) {
                // Eliminar tokens previos de reset de contraseña
                await AuthModel.eliminarTokenesUsuario(usuario.id_usuario, 'password_reset');

                // Generar nuevo token de reset
                const tokenReset = EmailService.generarToken();
                await AuthModel.crearTokenVerificacion(
                    usuario.id_usuario,
                    tokenReset,
                    'password_reset'
                );

                // Enviar email de reset
                try {
                    await EmailService.enviarEmailResetPassword(
                        email,
                        usuario.nombre_completo,
                        tokenReset
                    );
                    console.log('✅ Email de recuperación enviado a:', email);
                } catch (emailError) {
                    console.error('⚠️ Error enviando email de recuperación:', emailError.message);
                }
            }

            // Por seguridad, siempre devolver success, aunque el email no exista
            res.status(200).json({
                success: true,
                message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña',
                data: {
                    emailEnviado: true,
                    fecha: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error en solicitarResetPassword:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Reset de contraseña con token
    static async resetPassword(req, res) {
        try {
            const { token, nuevaPassword } = req.body;

            // Validar entrada
            const { error } = Joi.object({
                token: Joi.string().required(),
                nuevaPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
                    .messages({
                        'string.min': 'La contraseña debe tener al menos 8 caracteres',
                        'string.pattern.base': 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
                    })
            }).validate({ token, nuevaPassword });

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    details: error.details[0].message
                });
            }

            // Verificar que el token existe y está vigente
            const tokenInfo = await AuthModel.verificarTokenVerificacion(token, 'password_reset');

            if (!tokenInfo) {
                return res.status(400).json({
                    success: false,
                    message: 'Token de recuperación inválido o expirado'
                });
            }

            // Actualizar la contraseña del usuario
            await AuthModel.actualizarPassword(tokenInfo.id_usuario, nuevaPassword);

            // Eliminar el token usado y otros tokens de reset del usuario
            await AuthModel.eliminarTokenesUsuario(tokenInfo.id_usuario, 'password_reset');

            // Obtener info del usuario para el email
            const usuario = await AuthModel.buscarPorId(tokenInfo.id_usuario);

            // Enviar email de confirmación
            try {
                await EmailService.enviarEmailConfirmacionCambio(
                    usuario.email,
                    usuario.nombre_completo
                );
            } catch (emailError) {
                console.error('⚠️ Error enviando email de confirmación:', emailError.message);
            }

            res.status(200).json({
                success: true,
                message: 'Contraseña actualizada exitosamente',
                data: {
                    passwordActualizada: true,
                    fecha: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error en resetPassword:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // =================================
    // VERIFICACIÓN DE EMAIL
    // =================================

    // Verificar email con token
    static async verificarEmail(req, res) {
        try {
            const { token } = req.params;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token de verificación requerido'
                });
            }

            // Verificar que el token existe y está vigente
            const tokenInfo = await AuthModel.verificarTokenVerificacion(token, 'email_verification');

            if (!tokenInfo) {
                return res.status(400).json({
                    success: false,
                    message: 'Token de verificación inválido o expirado'
                });
            }

            // Verificar el email del usuario
            await AuthModel.verificarEmailUsuario(tokenInfo.id_usuario);

            // Eliminar el token usado
            await AuthModel.eliminarToken(token);

            res.status(200).json({
                success: true,
                message: 'Email verificado exitosamente. Tu cuenta está ahora activa.',
                data: {
                    emailVerificado: true,
                    fecha: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error en verificarEmail:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Verificar primer login con token
    static async verificarPrimerLogin(req, res) {
        try {
            const { token } = req.params;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token de verificación requerido'
                });
            }

            // Verificar que el token existe y está vigente
            const tokenInfo = await AuthModel.verificarTokenVerificacion(token, 'first_login_verification');

            if (!tokenInfo) {
                return res.status(400).json({
                    success: false,
                    message: 'Token de verificación inválido o expirado'
                });
            }

            // Marcar usuario como verificado en primer login
            await AuthModel.verificarEmailUsuario(tokenInfo.id_usuario);

            // Eliminar el token usado
            await AuthModel.eliminarToken(token);

            // Obtener datos del usuario
            const usuario = await AuthModel.buscarPorId(tokenInfo.id_usuario);

            res.status(200).json({
                success: true,
                message: 'Primer login verificado exitosamente. Tu cuenta está confirmada.',
                data: {
                    primerLoginVerificado: true,
                    usuario: {
                        id: usuario.id_usuario,
                        email: usuario.email,
                        nombre: usuario.nombre_completo
                    },
                    fecha: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error en verificarPrimerLogin:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Reenviar email de verificación
    static async reenviarVerificacion(req, res) {
        try {
            const usuario = await AuthModel.buscarPorId(req.usuario.userId);

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            if (usuario.email_verificado) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está verificado'
                });
            }

            // Implementar lógica de reenvío de email
            res.status(200).json({
                success: true,
                message: 'Email de verificación reenviado (funcionalidad pendiente de implementar)'
            });

        } catch (error) {
            console.error('Error en reenviarVerificacion:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // =================================
    // VALIDACIONES DE DISPONIBILIDAD
    // =================================

    // Verificar disponibilidad de email
    static async verificarEmailDisponible(req, res) {
        try {
            const { email } = req.body;

            const disponible = await AuthModel.emailDisponible(email);

            res.status(200).json({
                success: true,
                message: disponible ? 'Email disponible' : 'Email ya registrado',
                data: {
                    disponible,
                    email: email
                }
            });

        } catch (error) {
            console.error('Error en verificarEmailDisponible:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Verificar disponibilidad de username
    static async verificarUsernameDisponible(req, res) {
        try {
            const { nombre_usuario } = req.body;

            const disponible = await AuthModel.usernameDisponible(nombre_usuario);

            res.status(200).json({
                success: true,
                message: disponible ? 'Username disponible' : 'Username ya en uso',
                data: {
                    disponible,
                    nombre_usuario: nombre_usuario
                }
            });

        } catch (error) {
            console.error('Error en verificarUsernameDisponible:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = AuthController;
