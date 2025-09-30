const { query, getClient } = require('../config/database.config');
const bcrypt = require('bcryptjs');

class AuthModel {

    // =================================
    // FUNCIONES DE AUTENTICACIÓN
    // =================================

    // Buscar usuario por email para autenticación
    static async buscarUsuarioPorEmail(email) {
        try {
            const result = await query(
                'SELECT * FROM usuarios WHERE email = $1',
                [email]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error buscando usuario por email:', error.message);
            throw error;
        }
    }

    // Buscar usuario por nombre de usuario para autenticación
    static async buscarUsuarioPorUsername(nombre_usuario) {
        try {
            const result = await query(
                'SELECT * FROM usuarios WHERE nombre_usuario = $1',
                [nombre_usuario]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error buscando usuario por username:', error.message);
            throw error;
        }
    }

    // Buscar usuario por ID para validación de token
    static async buscarUsuarioPorId(id_usuario) {
        try {
            const result = await query(
                'SELECT id_usuario, email, nombre_usuario, nombre_completo, telefono, fecha_nacimiento, sexo, fecha_creacion, fecha_ultima_actividad, email_verificado, es_premium FROM usuarios WHERE id_usuario = $1',
                [id_usuario]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error buscando usuario por ID:', error.message);
            throw error;
        }
    }

    // =================================
    // FUNCIONES DE REGISTRO
    // =================================

    // Crear nuevo usuario
    static async crearUsuario(datosUsuario) {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            const {
                email,
                password,
                nombre_usuario,
                nombre_completo,
                telefono,
                fecha_nacimiento,
                sexo
            } = datosUsuario;

            // Hash de la contraseña
            const saltRounds = 12;
            const hash_contrasena = await bcrypt.hash(password, saltRounds);

            // Insertar usuario
            const result = await client.query(
                `INSERT INTO usuarios 
                (email, hash_contrasena, nombre_usuario, nombre_completo, telefono, fecha_nacimiento, sexo)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id_usuario, email, nombre_usuario, nombre_completo, telefono, fecha_nacimiento, sexo, fecha_creacion, email_verificado, es_premium`,
                [email, hash_contrasena, nombre_usuario, nombre_completo, telefono, fecha_nacimiento, sexo]
            );

            await client.query('COMMIT');
            return result.rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creando usuario:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    // =================================
    // FUNCIONES DE VALIDACIÓN
    // =================================

    // Verificar contraseña
    static async verificarPassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            console.error('Error verificando contraseña:', error.message);
            return false;
        }
    }

    // Verificar si email está disponible
    static async emailDisponible(email) {
        try {
            const result = await query(
                'SELECT id_usuario FROM usuarios WHERE email = $1',
                [email]
            );
            return result.rows.length === 0;
        } catch (error) {
            console.error('Error verificando disponibilidad de email:', error.message);
            throw error;
        }
    }

    // Verificar si username está disponible
    static async usernameDisponible(nombre_usuario) {
        try {
            const result = await query(
                'SELECT id_usuario FROM usuarios WHERE nombre_usuario = $1',
                [nombre_usuario]
            );
            return result.rows.length === 0;
        } catch (error) {
            console.error('Error verificando disponibilidad de username:', error.message);
            throw error;
        }
    }

    // =================================
    // FUNCIONES DE ACTIVIDAD
    // =================================

    // Actualizar última actividad
    static async actualizarUltimaActividad(id_usuario) {
        try {
            await query(
                'UPDATE usuarios SET fecha_ultima_actividad = $1 WHERE id_usuario = $2',
                [new Date(), id_usuario]
            );
        } catch (error) {
            console.error('Error actualizando última actividad:', error.message);
            // No lanzar error aquí ya que no es crítico
        }
    }

    // =================================
    // FUNCIONES DE RECUPERACIÓN DE CONTRASEÑA
    // =================================

    // Cambiar contraseña (para reset)
    static async cambiarPasswordPorEmail(email, nuevaPassword) {
        try {
            const saltRounds = 12;
            const hash_contrasena = await bcrypt.hash(nuevaPassword, saltRounds);

            const result = await query(
                `UPDATE usuarios 
                SET hash_contrasena = $1, fecha_ultima_actividad = $2
                WHERE email = $3
                RETURNING id_usuario, email`,
                [hash_contrasena, new Date(), email]
            );

            return result.rows[0];

        } catch (error) {
            console.error('Error cambiando contraseña por email:', error.message);
            throw error;
        }
    }

    // Actualizar contraseña por ID de usuario
    static async actualizarPassword(id_usuario, nuevaPassword) {
        try {
            const saltRounds = 12;
            const hash_contrasena = await bcrypt.hash(nuevaPassword, saltRounds);

            const result = await query(
                `UPDATE usuarios 
                SET hash_contrasena = $1, fecha_ultima_actividad = $2
                WHERE id_usuario = $3
                RETURNING id_usuario, email`,
                [hash_contrasena, new Date(), id_usuario]
            );

            return result.rows[0];

        } catch (error) {
            console.error('Error actualizando contraseña:', error.message);
            throw error;
        }
    }

    // Buscar por ID (alias para compatibilidad)
    static async buscarPorId(id_usuario) {
        return await this.buscarUsuarioPorId(id_usuario);
    }

    // =================================
    // FUNCIONES DE VERIFICACIÓN DE EMAIL
    // =================================

    // Crear token de verificación
    static async crearTokenVerificacion(id_usuario, token, tipo = 'email_verification') {
        try {
            // Primero eliminar tokens anteriores del mismo tipo para este usuario
            await query(
                'DELETE FROM tokens_verificacion WHERE id_usuario = $1 AND tipo = $2',
                [id_usuario, tipo]
            );

            // Crear nuevo token
            const expiraEn = new Date();
            if (tipo === 'email_verification' || tipo === 'first_login_verification') {
                expiraEn.setHours(expiraEn.getHours() + 24); // 24 horas
            } else if (tipo === 'password_reset') {
                expiraEn.setHours(expiraEn.getHours() + 1); // 1 hora
            }

            const result = await query(
                `INSERT INTO tokens_verificacion 
                (id_usuario, token, tipo, expira_en, creado_en)
                VALUES ($1, $2, $3, $4, NOW())
                RETURNING *`,
                [id_usuario, token, tipo, expiraEn]
            );

            return result.rows[0];

        } catch (error) {
            console.error('Error creando token de verificación:', error.message);
            throw error;
        }
    }

    // Validar y obtener token de verificación
    static async validarToken(token, tipo) {
        try {
            const result = await query(
                `SELECT tv.*, u.email, u.nombre_completo, u.nombre_usuario
                FROM tokens_verificacion tv
                JOIN usuarios u ON tv.id_usuario = u.id_usuario
                WHERE tv.token = $1 AND tv.tipo = $2 AND tv.usado = false AND tv.expira_en > NOW()`,
                [token, tipo]
            );

            return result.rows[0] || null;

        } catch (error) {
            console.error('Error validando token:', error.message);
            throw error;
        }
    }

    // Verificar token de verificación (alias para compatibilidad con controller)
    static async verificarTokenVerificacion(token, tipo) {
        return await this.validarToken(token, tipo);
    }

    // Eliminar tokens de un usuario por tipo
    static async eliminarTokenesUsuario(id_usuario, tipo) {
        try {
            const result = await query(
                'DELETE FROM tokens_verificacion WHERE id_usuario = $1 AND tipo = $2',
                [id_usuario, tipo]
            );
            return result.rowCount;
        } catch (error) {
            console.error('Error eliminando tokens de usuario:', error.message);
            throw error;
        }
    }

    // Contar tokens de un usuario por tipo
    static async contarTokenesUsuario(id_usuario, tipo) {
        try {
            const result = await query(
                'SELECT COUNT(*) as total FROM tokens_verificacion WHERE id_usuario = $1 AND tipo = $2',
                [id_usuario, tipo]
            );
            return parseInt(result.rows[0].total);
        } catch (error) {
            console.error('Error contando tokens de usuario:', error.message);
            throw error;
        }
    }

    // Eliminar token específico
    static async eliminarToken(token) {
        try {
            const result = await query(
                'DELETE FROM tokens_verificacion WHERE token = $1',
                [token]
            );
            return result.rowCount;
        } catch (error) {
            console.error('Error eliminando token:', error.message);
            throw error;
        }
    }

    // Marcar token como usado
    static async marcarTokenUsado(token) {
        try {
            const result = await query(
                'UPDATE tokens_verificacion SET usado = true, usado_en = NOW() WHERE token = $1 RETURNING *',
                [token]
            );

            return result.rows[0];

        } catch (error) {
            console.error('Error marcando token como usado:', error.message);
            throw error;
        }
    }

    // Limpiar tokens expirados
    static async limpiarTokensExpirados() {
        try {
            const result = await query(
                'DELETE FROM tokens_verificacion WHERE expira_en < NOW() OR usado = true'
            );

            console.log(`🧹 Tokens expirados eliminados: ${result.rowCount}`);
            return result.rowCount;

        } catch (error) {
            console.error('Error limpiando tokens expirados:', error.message);
            throw error;
        }
    }

    // Verificar email de usuario
    static async verificarEmailUsuario(id_usuario) {
        try {
            const result = await query(
                `UPDATE usuarios 
                SET email_verificado = true, fecha_ultima_actividad = $1
                WHERE id_usuario = $2
                RETURNING id_usuario, email_verificado`,
                [new Date(), id_usuario]
            );

            return result.rows[0];

        } catch (error) {
            console.error('Error verificando email:', error.message);
            throw error;
        }
    }

    // Verificar email (alias para compatibilidad)
    static async verificarEmail(id_usuario) {
        return await this.verificarEmailUsuario(id_usuario);
    }

    // Obtener usuario para verificación de email
    static async obtenerUsuarioParaVerificacion(id_usuario) {
        try {
            const result = await query(
                'SELECT id_usuario, email, email_verificado FROM usuarios WHERE id_usuario = $1',
                [id_usuario]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error obteniendo usuario para verificación:', error.message);
            throw error;
        }
    }
}

module.exports = AuthModel;
