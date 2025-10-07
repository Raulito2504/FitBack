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
        "SELECT id, email, usuario, edad, altura_cm, peso_kg, sexo, imc, objetivo, fecha_creacion, email_verificado FROM usuarios WHERE id = $1",
        [id],
      )
      return result.rows[0] || null
    } catch (error) {
      console.error("Error buscando usuario por ID:", error.message)
      throw error
    }
  }

  // =================================
  // FUNCIONES DE REGISTRO
  // =================================

  // Crear nuevo usuario
  static async crearUsuario(datosUsuario) {
    const client = await getClient()

    try {
      await client.query("BEGIN")

      const { email, password, usuario, edad, altura_cm, peso_kg, sexo, objetivo } = datosUsuario

      // Calcular IMC
      const altura_m = altura_cm / 100
      const imc = (peso_kg / (altura_m * altura_m)).toFixed(2)

      // Hash de la contraseña
      const saltRounds = 12
      const hash_contrasena = await bcrypt.hash(password, saltRounds)

      // Insertar usuario
      const result = await client.query(
        `INSERT INTO usuarios 
                (email, hash_contrasena, usuario, edad, altura_cm, peso_kg, sexo, imc, objetivo)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id, email, usuario, edad, altura_cm, peso_kg, sexo, imc, objetivo, fecha_creacion, email_verificado`,
        [email, hash_contrasena, usuario, edad, altura_cm, peso_kg, sexo, imc, objetivo],
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
  // FUNCIONES DE RECUPERACIÓN DE CONTRASEÑA
  // =================================

  // Cambiar contraseña (para reset)
  static async cambiarPasswordPorEmail(email, nuevaPassword) {
    try {
      const saltRounds = 12
      const hash_contrasena = await bcrypt.hash(nuevaPassword, saltRounds)

      const result = await query(
        `UPDATE usuarios 
                SET hash_contrasena = $1
                WHERE email = $2
                RETURNING id, email`,
        [hash_contrasena, email],
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
                SET email_verificado = true
                WHERE id = $1
                RETURNING id, email_verificado`,
        [id],
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
