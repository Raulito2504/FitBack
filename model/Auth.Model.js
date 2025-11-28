const { query, getClient } = require("../config/database.config")
const bcrypt = require("bcryptjs")

class AuthModel {
  // =================================
  // FUNCIONES DE AUTENTICACIÓN
  // =================================
  // Buscar usuario por email para autenticación
  static async buscarUsuarioPorEmail(email) {
    try {
      const result = await query("SELECT * FROM usuarios WHERE email = $1", [email])
      return result.rows[0] || null
    } catch (error) {
      console.error("Error buscando usuario por email:", error.message)
      throw error
    }
  }
  // Buscar usuario por nombre de usuario para autenticación
  static async buscarUsuarioPorUsername(usuario) {
    try {
      const result = await query("SELECT * FROM usuarios WHERE usuario = $1", [usuario])
      return result.rows[0] || null
    } catch (error) {
      console.error("Error buscando usuario por username:", error.message)
      throw error
    }
  }
  // Buscar usuario por ID para validación de token
  static async buscarUsuarioPorId(id) {
    try {
      const result = await query(
        "SELECT id, email, usuario, edad, altura_cm, sexo, peso_actual, peso_deseado, imc, objetivo, fecha_creacion, fecha_ultima_actividad, email_verificado FROM usuarios WHERE id = $1",
        [id],
      )
      return result.rows[0] || null
    } catch (error) {
      console.error("Error buscando usuario por ID:", error.message)
      throw error
    }
  }

  static async buscarPorId(id) {
    return this.buscarUsuarioPorId(id)
  }

  // =================================
  // FUNCIONES DE REGISTRO
  // =================================
  // Crear nuevo usuario
  static async crearUsuario(datosUsuario) {
    const client = await getClient()
    try {
      await client.query("BEGIN")
      const { email, password, usuario } = datosUsuario
      // Hash de la contraseña
      const saltRounds = 12
      const hash_contrasena = await bcrypt.hash(password, saltRounds)

      
      // Insertar usuario con campos opcionales
      const result = await client.query(
        `INSERT INTO usuarios 
                (email, hash_contrasena, usuario)
                VALUES ($1, $2, $3)
                RETURNING id, email, usuario, edad, altura_cm, sexo, peso_actual, peso_deseado, imc, objetivo, fecha_creacion, fecha_ultima_actividad, email_verificado`,
        [email, hash_contrasena, usuario],
      )
      await client.query("COMMIT")
      return result.rows[0]
    } catch (error) {
      await client.query("ROLLBACK")
      console.error("Error creando usuario:", error.message)
      throw error
    } finally {
      client.release()
    }
  }
  // =================================
  // FUNCIONES DE VALIDACIÓN
  // =================================
  // Verificar contraseña
  static async verificarPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash)
    } catch (error) {
      console.error("Error verificando contraseña:", error.message)
      return false
    }
  }
  // Verificar si email está disponible
  static async emailDisponible(email) {
    try {
      const result = await query("SELECT id FROM usuarios WHERE email = $1", [email])
      return result.rows.length === 0
    } catch (error) {
      console.error("Error verificando disponibilidad de email:", error.message)
      throw error
    }
  }
  // Verificar si username está disponible
  static async usernameDisponible(usuario) {
    try {
      const result = await query("SELECT id FROM usuarios WHERE usuario = $1", [usuario])
      return result.rows.length === 0
    } catch (error) {
      console.error("Error verificando disponibilidad de username:", error.message)
      throw error
    }
  }
  // =================================
  // FUNCIONES DE ACTIVIDAD
  // =================================
  // Actualizar última actividad
  static async actualizarUltimaActividad(id) {
    try {
      await query("UPDATE usuarios SET fecha_ultima_actividad = $1 WHERE id = $2", [new Date(), id])
    } catch (error) {
      console.error("Error actualizando última actividad:", error.message)
      // No lanzar error aquí ya que no es crítico
    }
  }
  // =================================
  // FUNCIONES DE RECUPERACIÓN DE CONTRASEÑA
  // =================================
  // Cambiar contraseña (para reset)
  static async cambiarPasswordPorEmail(email, nuevaPassword) {
    try {
      const saltRounds = 12
      const hash_contrasena = await bcrypt.hash(nuevaPassword, saltRounds)

      const result = await query(
        `UPDATE usuarios 
                SET hash_contrasena = $1, fecha_ultima_actividad = $2
                WHERE email = $3
                RETURNING id, email`,
        [hash_contrasena, new Date(), email],
      )
      return result.rows[0]
    } catch (error) {
      console.error("Error cambiando contraseña por email:", error.message)
      throw error
    }
  }
  // =================================
  // FUNCIONES DE VERIFICACIÓN DE EMAIL
  // =================================
  // Verificar email
  static async verificarEmail(id) {
    try {
      const result = await query(
        `UPDATE usuarios 
                SET email_verificado = true, fecha_ultima_actividad = $1
                WHERE id = $2
                RETURNING id, email_verificado`,
        [new Date(), id],
      )
      return result.rows[0]
    } catch (error) {
      console.error("Error verificando email:", error.message)
      throw error
    }
  }
  // Obtener usuario para verificación de email
  static async obtenerUsuarioParaVerificacion(id) {
    try {
      const result = await query("SELECT id, email, email_verificado FROM usuarios WHERE id = $1", [id])
      return result.rows[0] || null
    } catch (error) {
      console.error("Error obteniendo usuario para verificación:", error.message)
      throw error
    }
  }
}

module.exports = AuthModel
