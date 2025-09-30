const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');

// Configurar SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {

    // =================================
    // CONFIGURACIÓN Y UTILIDADES
    // =================================

    // Generar token seguro para verificación/reset
    static generarToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Configuración base para emails
    static getBaseConfig() {
        return {
            from: {
                email: process.env.SENDGRID_FROM_EMAIL,
                name: process.env.SENDGRID_FROM_NAME
            }
        };
    }

    // =================================
    // VERIFICACIÓN DE EMAIL
    // =================================

    // Enviar email de verificación de cuenta
    static async enviarEmailVerificacion(email, nombre, token) {
        try {
            const verificationUrl = `${process.env.APP_URL}/api/auth/verificar-email/${token}`;
            const frontendUrl = `${process.env.FRONTEND_URL}/email-verificado?token=${token}`;

            const msg = {
                ...this.getBaseConfig(),
                to: email,
                subject: '✅ Verifica tu cuenta en FitLife',
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                        .content { padding: 30px; background-color: #f9f9f9; }
                        .button { 
                            display: inline-block; 
                            background-color: #4CAF50; 
                            color: white; 
                            padding: 12px 30px; 
                            text-decoration: none; 
                            border-radius: 5px; 
                            margin: 20px 0; 
                        }
                        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🏋️‍♂️ ¡Bienvenido a FitLife!</h1>
                        </div>
                        <div class="content">
                            <h2>Hola ${nombre} 👋</h2>
                            <p>¡Gracias por registrarte en FitLife! Estás a un paso de comenzar tu viaje fitness.</p>
                            
                            <p><strong>Tu token de verificación:</strong></p>
                            <div style="background-color: #f8f9fa; border: 2px solid #28a745; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                                <code style="font-size: 14px; word-break: break-all;">${token}</code>
                            </div>
                            
                            <p><strong>📝 Instrucciones:</strong></p>
                            <ol>
                                <li>Copia el token de arriba</li>
                                <li>Usa la API: <code>GET http://localhost:5005/api/auth/verificar-email/TOKEN</code></li>
                                <li>Reemplaza TOKEN con el código de arriba</li>
                            </ol>
                            
                            <p>⏰ <strong>Este token expira en 24 horas</strong> por seguridad.</p>
                            
                            <hr style="margin: 30px 0;">
                            
                            <h3>🎯 ¿Qué sigue después?</h3>
                            <ul>
                                <li>✅ Configura tu perfil completo</li>
                                <li>🏋️‍♂️ Explora nuestras rutinas de ejercicio</li>
                                <li>📊 Haz seguimiento de tu progreso</li>
                                <li>🎉 ¡Comienza tu transformación!</li>
                            </ul>
                        </div>
                        <div class="footer">
                            <p>Si no creaste esta cuenta, puedes ignorar este email.</p>
                            <p>© 2025 FitLife - Tu compañero en el fitness</p>
                        </div>
                    </div>
                </body>
                </html>
                `,
                text: `
                ¡Bienvenido a FitLife, ${nombre}!
                
                Para verificar tu cuenta, visita este enlace:
                ${frontendUrl}
                
                Este enlace expira en 24 horas.
                
                Si no creaste esta cuenta, puedes ignorar este email.
                
                © 2025 FitLife
                `
            };

            const response = await sgMail.send(msg);
            console.log('✅ Email de verificación enviado:', email);
            return {
                success: true,
                messageId: response[0].headers['x-message-id']
            };

        } catch (error) {
            console.error('❌ Error enviando email de verificación:', error.message);
            if (error.response) {
                console.error('SendGrid Error:', error.response.body);
            }
            throw error;
        }
    }

    // =================================
    // RECUPERACIÓN DE CONTRASEÑA
    // =================================

    // Enviar email de reset de contraseña
    static async enviarEmailResetPassword(email, nombre, token) {
        try {
            const resetUrl = `Token para API: ${token}`;

            const msg = {
                ...this.getBaseConfig(),
                to: email,
                subject: '🔐 Restablece tu contraseña - FitBack',
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                        .header { background-color: #ff6b35; color: white; padding: 20px; text-align: center; }
                        .content { padding: 30px; background-color: #f9f9f9; }
                        .token-box { 
                            background-color: #f8f9fa; 
                            border: 2px solid #007bff; 
                            padding: 20px; 
                            border-radius: 8px; 
                            margin: 20px 0;
                            text-align: center;
                        }
                        .warning { 
                            background-color: #fff3cd; 
                            border: 1px solid #ffeaa7; 
                            padding: 15px; 
                            border-radius: 5px; 
                            margin: 20px 0; 
                        }
                        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 Restablece tu Contraseña</h1>
                        </div>
                        <div class="content">
                            <h2>Hola ${nombre} 👋</h2>
                            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en FitBack.</p>
                            
                            <div class="warning">
                                <strong>⚠️ Importante:</strong> Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña actual permanecerá segura.
                            </div>
                            
                            <p><strong>Tu token de recuperación:</strong></p>
                            <div class="token-box">
                                <code style="font-size: 14px; word-break: break-all;">${token}</code>
                            </div>
                            
                            <p><strong>📝 Instrucciones:</strong></p>
                            <ol>
                                <li>Copia el token de arriba</li>
                                <li>Usa la API: <code>POST http://localhost:5005/api/auth/reset-password</code></li>
                                <li>Incluye el token y tu nueva contraseña en el body</li>
                            </ol>
                            
                            <p>⏰ <strong>Este token expira en 1 hora</strong> por seguridad.</p>
                            
                            <hr style="margin: 30px 0;">
                            
                            <h3>🔒 Consejos de Seguridad:</h3>
                            <ul>
                                <li>🔑 Usa una contraseña única y fuerte</li>
                                <li>📱 Considera usar un gestor de contraseñas</li>
                                <li>🚫 No compartas tu contraseña con nadie</li>
                                <li>🔄 Cambia tu contraseña regularmente</li>
                            </ul>
                        </div>
                        <div class="footer">
                            <p>Este email se envió a ${email}</p>
                            <p>© 2025 FitLife - Tu compañero en el fitness</p>
                        </div>
                    </div>
                </body>
                </html>
                `,
                text: `
                Hola ${nombre},
                
                Recibimos una solicitud para restablecer tu contraseña en FitLife.
                
                Para crear una nueva contraseña, visita este enlace:
                ${resetUrl}
                
                Este enlace expira en 1 hora por seguridad.
                
                Si no solicitaste este cambio, puedes ignorar este email.
                
                © 2025 FitLife
                `
            };

            const response = await sgMail.send(msg);
            console.log('✅ Email de reset enviado:', email);
            return {
                success: true,
                messageId: response[0].headers['x-message-id']
            };

        } catch (error) {
            console.error('❌ Error enviando email de reset:', error.message);
            if (error.response) {
                console.error('SendGrid Error:', error.response.body);
            }
            throw error;
        }
    }

    // =================================
    // EMAILS INFORMATIVOS
    // =================================

    // Enviar email de bienvenida (después de verificación)
    static async enviarEmailBienvenida(email, nombre) {
        try {
            const msg = {
                ...this.getBaseConfig(),
                to: email,
                subject: '🎉 ¡Cuenta verificada! Bienvenido a FitLife',
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                        .content { padding: 30px; background-color: #f9f9f9; }
                        .feature { margin: 15px 0; padding: 15px; background-color: white; border-radius: 5px; }
                        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 ¡Cuenta Verificada Exitosamente!</h1>
                        </div>
                        <div class="content">
                            <h2>¡Felicidades ${nombre}! 🏆</h2>
                            <p>Tu cuenta en FitLife ha sido verificada correctamente. ¡Ya puedes comenzar tu viaje fitness!</p>
                            
                            <h3>🚀 ¿Qué puedes hacer ahora?</h3>
                            
                            <div class="feature">
                                <strong>📝 Completa tu Perfil</strong><br>
                                Añade información sobre tus objetivos fitness y preferencias de entrenamiento.
                            </div>
                            
                            <div class="feature">
                                <strong>🏋️‍♂️ Explora Rutinas</strong><br>
                                Descubre rutinas personalizadas según tu nivel y objetivos.
                            </div>
                            
                            <div class="feature">
                                <strong>📊 Seguimiento de Progreso</strong><br>
                                Registra tus entrenamientos y observa tu evolución.
                            </div>
                            
                            <div class="feature">
                                <strong>🎯 Establece Metas</strong><br>
                                Define objetivos realistas y alcánzalos paso a paso.
                            </div>
                            
                            <p style="text-align: center; margin-top: 30px;">
                                <strong>🌟 ¡Tu transformación comienza ahora!</strong>
                            </p>
                        </div>
                        <div class="footer">
                            <p>© 2025 FitLife - Tu compañero en el fitness</p>
                        </div>
                    </div>
                </body>
                </html>
                `
            };

            const response = await sgMail.send(msg);
            console.log('✅ Email de bienvenida enviado:', email);
            return {
                success: true,
                messageId: response[0].headers['x-message-id']
            };

        } catch (error) {
            console.error('❌ Error enviando email de bienvenida:', error.message);
            // No lanzar error aquí ya que no es crítico
            return { success: false, error: error.message };
        }
    }

    // =================================
    // UTILIDADES Y TESTING
    // =================================

    // Verificar configuración de SendGrid
    static async verificarConfiguracion() {
        try {
            // Test básico de configuración
            if (!process.env.SENDGRID_API_KEY) {
                throw new Error('SENDGRID_API_KEY no está configurada');
            }

            if (!process.env.SENDGRID_FROM_EMAIL) {
                throw new Error('SENDGRID_FROM_EMAIL no está configurada');
            }

            console.log('✅ Configuración de SendGrid verificada');
            return true;

        } catch (error) {
            console.error('❌ Error en configuración de SendGrid:', error.message);
            return false;
        }
    }

    // Enviar email de prueba (solo para testing)
    static async enviarEmailPrueba(email) {
        try {
            const msg = {
                ...this.getBaseConfig(),
                to: email,
                subject: '🧪 Email de Prueba - FitLife',
                html: `
                <h1>✅ Configuración Exitosa</h1>
                <p>Este es un email de prueba para verificar que SendGrid está funcionando correctamente.</p>
                <p><strong>Enviado desde:</strong> ${process.env.SENDGRID_FROM_EMAIL}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                `
            };

            const response = await sgMail.send(msg);
            console.log('✅ Email de prueba enviado exitosamente');
            return { success: true, messageId: response[0].headers['x-message-id'] };

        } catch (error) {
            console.error('❌ Error enviando email de prueba:', error.message);
            throw error;
        }
    }

    /**
     * Enviar email de primer login con token de verificación
     */
    static async enviarEmailPrimerLogin(email, nombreCompleto, token) {
        try {
            const verificarUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verificar-primer-login/${token}`;

            const emailData = {
                to: email,
                from: {
                    email: this.fromEmail,
                    name: 'FitBack - Seguridad'
                },
                subject: '🔐 Verificación de Primer Acceso - FitBack',
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Verificación de Primer Acceso</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Verificación de Seguridad</h1>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                        <h2 style="color: #495057; margin-top: 0;">¡Hola ${nombreCompleto}!</h2>
                        
                        <p style="font-size: 16px; margin-bottom: 20px;">
                            Detectamos que es tu <strong>primer acceso</strong> a FitBack desde este dispositivo. 
                            Por seguridad, necesitamos verificar que realmente eres tú.
                        </p>

                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #856404;">
                                <strong>⚠️ Importante:</strong> Si no iniciaste sesión recientemente, 
                                ignora este email y considera cambiar tu contraseña.
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificarUrl}" 
                               style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                                ✅ Verificar que soy yo
                            </a>
                        </div>
                        
                        <div style="background: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 14px; color: #6c757d;">
                                <strong>Información del acceso:</strong><br>
                                📧 Email: ${email}<br>
                                🕐 Fecha: ${new Date().toLocaleString('es-ES')}<br>
                                ⏰ Este token expira en 24 horas
                            </p>
                        </div>
                        
                        <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
                            Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
                            <span style="word-break: break-all; background: #f8f9fa; padding: 5px; border-radius: 4px;">${verificarUrl}</span>
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                        
                        <p style="font-size: 12px; color: #6c757d; text-align: center; margin: 0;">
                            Este es un email automático de seguridad de FitBack.<br>
                            Si tienes dudas, contáctanos en: soporte@fitback.com
                        </p>
                    </div>
                </body>
                </html>
                `
            };

            await sgMail.send(emailData);
            console.log('✅ Email de primer login enviado exitosamente');

        } catch (error) {
            console.error('❌ Error enviando email de primer login:', error);
            throw new Error('Error al enviar email de primer login');
        }
    }

    /**
     * Enviar email de confirmación de cambio de contraseña
     */
    static async enviarEmailConfirmacionCambio(email, nombreCompleto) {
        try {
            const emailData = {
                ...this.getBaseConfig(),
                to: email,
                subject: '✅ Contraseña Actualizada - FitBack',
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Contraseña Actualizada</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">✅ Contraseña Actualizada</h1>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                        <h2 style="color: #495057; margin-top: 0;">¡Hola ${nombreCompleto}!</h2>
                        
                        <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                            <h3 style="color: #155724; margin: 0 0 10px 0;">🔐 Tu contraseña ha sido actualizada</h3>
                            <p style="margin: 0; color: #155724;">
                                El cambio se realizó exitosamente el ${new Date().toLocaleString('es-ES')}
                            </p>
                        </div>
                        
                        <p style="font-size: 16px; margin-bottom: 20px;">
                            Tu contraseña de FitBack ha sido cambiada exitosamente. 
                            Ya puedes usar tu nueva contraseña para acceder a tu cuenta.
                        </p>

                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #856404;">
                                <strong>⚠️ ¿No fuiste tú?</strong><br>
                                Si no solicitaste este cambio, contacta inmediatamente a nuestro equipo de soporte.
                            </p>
                        </div>
                        
                        <div style="background: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 14px; color: #6c757d;">
                                <strong>Detalles de seguridad:</strong><br>
                                📧 Cuenta: ${email}<br>
                                🕐 Fecha del cambio: ${new Date().toLocaleString('es-ES')}<br>
                                🔒 Método: Recuperación por email
                            </p>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                               style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                                🏠 Ir a mi cuenta
                            </a>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                        
                        <p style="font-size: 12px; color: #6c757d; text-align: center; margin: 0;">
                            Este es un email automático de seguridad de FitBack.<br>
                            Si necesitas ayuda, contáctanos en: soporte@fitback.com
                        </p>
                    </div>
                </body>
                </html>
                `
            };

            await sgMail.send(emailData);
            console.log('✅ Email de confirmación de cambio enviado exitosamente');

        } catch (error) {
            console.error('❌ Error enviando email de confirmación:', error);
            throw new Error('Error al enviar email de confirmación');
        }
    }
}

module.exports = EmailService;