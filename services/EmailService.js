const sgMail = require('@sendgrid/mail');

class EmailService {
    // Configuración inicial
    static init() {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }

    // IDs de los templates de SendGrid - ✅ CONFIGURADOS
    static TEMPLATES = {
        EMAIL_VERIFICATION: process.env.SENDGRID_TEMPLATE_EMAIL_VERIFICATION || 'd-59251a1d8bb6403ea1c4a6599b0c5d95',
        PASSWORD_RESET: process.env.SENDGRID_TEMPLATE_PASSWORD_RESET || 'd-13b6f70a62dd4ec582bed26307918888',
        PASSWORD_CHANGED: process.env.SENDGRID_TEMPLATE_PASSWORD_CHANGED || 'd-95f88591ee594b95bc683f00176010dd'
    };

    // Configuración base para todos los emails
    static getBaseConfig() {
        return {
            from: {
                email: process.env.SENDGRID_FROM_EMAIL,
                name: 'FitBack'
            }
        };
    }

    // Generar token único
    static generarToken() {
        const crypto = require('crypto');
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Enviar email de verificación de cuenta
     */
    static async enviarEmailVerificacion(email, nombre, token) {
        try {
            const msg = {
                ...this.getBaseConfig(),
                to: email,
                templateId: this.TEMPLATES.EMAIL_VERIFICATION,
                dynamicTemplateData: {
                    nombre: nombre,
                    token: token,
                    api_url: `http://localhost:5005/api/auth/verificar-email/${token}`,
                    expiration_time: '24 horas',
                    year: new Date().getFullYear()
                }
            };

            await sgMail.send(msg);
            console.log('✅ Email de verificación enviado exitosamente a:', email);
            
        } catch (error) {
            console.error('❌ Error enviando email de verificación:', error);
            throw new Error('Error al enviar email de verificación');
        }
    }

    /**
     * Enviar email de reset de contraseña
     */
    static async enviarEmailResetPassword(email, nombre, token) {
        try {
            const msg = {
                ...this.getBaseConfig(),
                to: email,
                templateId: this.TEMPLATES.PASSWORD_RESET,
                dynamicTemplateData: {
                    nombre: nombre,
                    token: token,
                    api_url: `http://localhost:5005/api/auth/reset-password`,
                    api_instructions: `POST ${process.env.API_URL || 'http://localhost:5005'}/api/auth/reset-password`,
                    expiration_time: '1 hora',
                    year: new Date().getFullYear()
                }
            };

            await sgMail.send(msg);
            console.log('✅ Email de reset enviado exitosamente a:', email);
            
        } catch (error) {
            console.error('❌ Error enviando email de reset:', error);
            throw new Error('Error al enviar email de reset');
        }
    }

    /**
     * Enviar email de confirmación de cambio de contraseña
     */
    static async enviarEmailConfirmacionCambio(email, nombre) {
        try {
            const msg = {
                ...this.getBaseConfig(),
                to: email,
                templateId: this.TEMPLATES.PASSWORD_CHANGED,
                dynamicTemplateData: {
                    nombre: nombre,
                    fecha_cambio: new Date().toLocaleString('es-ES'),
                    login_url: `http://localhost:5005`,
                    year: new Date().getFullYear()
                }
            };

            await sgMail.send(msg);
            console.log('✅ Email de confirmación enviado exitosamente a:', email);
            
        } catch (error) {
            console.error('❌ Error enviando email de confirmación:', error);
            throw new Error('Error al enviar email de confirmación');
        }
    }

    /**
     * Validar configuración de SendGrid
     */
    static async validarConfiguracion() {
        try {
            if (!process.env.SENDGRID_API_KEY) {
                throw new Error('SENDGRID_API_KEY no configurado');
            }
            
            if (!process.env.SENDGRID_FROM_EMAIL) {
                throw new Error('SENDGRID_FROM_EMAIL no configurado');
            }
            
            console.log('✅ Configuración de SendGrid válida');
            return true;
            
        } catch (error) {
            console.error('❌ Error en configuración de SendGrid:', error.message);
            return false;
        }
    }

    /**
     * Email de prueba (para testing)
     */
    static async enviarEmailPrueba(email) {
        try {
            const msg = {
                ...this.getBaseConfig(),
                to: email,
                subject: '🧪 Email de Prueba - FitBack',
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
}

// Inicializar al cargar el módulo
EmailService.init();

module.exports = EmailService;