const { query, getClient } = require("../config/database.config")
const bcrypt = require("bcryptjs")

class UsuariosModel {
  // =================================
  // FUNCIONES DE CONSULTA
  // =================================
  // Buscar usuario por email
  static async buscarPorEmail(email) {
    try {
      const result = await query("SELECT * FROM usuarios WHERE email = $1", [email])
      return result.rows[0] || null
    } catch (error) {
      console.error("Error buscando usuario por email:", error.message)
      throw error
    }
  }
  // Buscar usuario por email incluyendo contraseña (para cambio de password)
  static async buscarPorEmailCompleto(email) {
    try {
      const result = await query("SELECT * FROM usuarios WHERE email = $1", [email])
      return result.rows[0] || null
    } catch (error) {
      console.error("Error buscando usuario completo por email:", error.message)
      throw error
    }
  }
  // Buscar usuario por nombre de usuario
  static async buscarPorUsername(usuario) {
    try {
      const result = await query("SELECT * FROM usuarios WHERE usuario = $1", [usuario])
      return result.rows[0] || null
    } catch (error) {
      console.error("Error buscando usuario por username:", error.message)
      throw error
    }
  }
  // Buscar usuario por ID
  static async buscarPorId(id) {
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
  // =================================
  // FUNCIONES DE CREACIÓN
  // =================================
  // Crear nuevo usuario
  static async crear(datosUsuario) {
    const client = await getClient()
    try {
      await client.query("BEGIN")
      const {
        email,
        password,
        usuario,
        edad,
        altura_cm,
        sexo,
        peso_actual,
        peso_deseado,
        imc,
        objetivo,
      } = datosUsuario
      // Hash de la contraseña
      const saltRounds = 12
      const hash_contrasena = await bcrypt.hash(password, saltRounds)
      // Insertar usuario
      const result = await client.query(
        `INSERT INTO usuarios (
          email,
          hash_contrasena,
          usuario,
          edad,
          altura_cm,
          sexo,
          peso_actual,
          peso_deseado,
          imc,
          objetivo
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )
        RETURNING
          id,
          email,
          usuario,
          edad,
          altura_cm,
          sexo,
          peso_actual,
          peso_deseado,
          imc,
          objetivo,
          fecha_creacion,
          fecha_ultima_actividad,
          email_verificado
        `,
        [
          email,
          hash_contrasena,
          usuario,
          edad,
          altura_cm,
          sexo,
          peso_actual,
          peso_deseado,
          imc,
          objetivo,
        ],
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
  // FUNCIONES DE ACTUALIZACIÓN
  // =================================
  // Actualizar perfil de usuario
  static async actualizarPerfil(id, datosActualizacion) {
    try {
      const camposPermitidos = [
        "edad",
        "sexo",
        "altura_cm",
        "peso_actual",
        "peso_deseado",
        "imc",
        "objetivo",
      ]
      const campos = []
      const valores = []
      let contador = 1
      // Construir query dinámicamente
      for (const [campo, valor] of Object.entries(datosActualizacion)) {
        if (camposPermitidos.includes(campo) && valor !== undefined) {
          campos.push(`${campo} = $${contador}`)
          valores.push(valor)
          contador++
        }
      }
      if (campos.length === 0) {
        throw new Error("No hay campos válidos para actualizar")
      }
      // Añadir fecha de última actividad 
      campos.push(`fecha_ultima_actividad = $${contador}`)
      valores.push(new Date())
      contador++
      // Añadir ID del usuario
      valores.push(id)
      const sqlQuery = `UPDATE usuarios SET ${campos.join(", ")} WHERE id = $${contador} RETURNING id, email, usuario, edad, sexo, altura_cm, peso_actual, peso_deseado, imc, objetivo, fecha_creacion, fecha_ultima_actividad, email_verificado`
      const result = await query(sqlQuery, valores)
      return result.rows[0]
    } catch (error) {
      console.error("Error actualizando perfil:", error.message)
      throw error
    }
  }
  // Cambiar contraseña
  static async cambiarPassword(id, nuevaPassword) {
    try {
      const saltRounds = 12
      const hash_contrasena = await bcrypt.hash(nuevaPassword, saltRounds)
      const result = await query(
        `UPDATE usuarios
        SET hash_contrasena = $1, fecha_ultima_actividad = $2
        WHERE id = $3
        RETURNING id
        `,
        [hash_contrasena, new Date(), id],
      )
      return result.rows[0]
    } catch (error) {
      console.error("Error cambiando contraseña:", error.message)
      throw error
    }
  }
  // ⚠️ TEMPORALMENTE DESHABILITADO - Verificar email
  // TODO: Decidir dónde implementar la verificación de email
  /*
  static async verificarEmail(id) {
    try {
      const result = await query(
        `UPDATE usuarios
        SET email_verificado = true, fecha_ultima_actividad = $1
        WHERE id = $2
        RETURNING id, email_verificado
        `,
        [new Date(), id],
      )
      return result.rows[0]
    } catch (error) {
      console.error("Error verificando email:", error.message)
      throw error
    }
  }
  */
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
  // FUNCIONES DE ELIMINACIÓN
  // =================================
  // Eliminar usuario
  static async eliminar(id) {
    try {
      const result = await query("DELETE FROM usuarios WHERE id = $1 RETURNING id", [id])

      return result.rows[0]
    } catch (error) {
      console.error("Error eliminando usuario:", error.message)
      throw error
    }
  }
  // ==================================
  // FUNCIONES ADMINISTRATIVAS
  // =================================
  // Obtener todos los usuarios (paginado)
  static async obtenerTodos(limite = 50, offset = 0) {
    try {
      const result = await query(
        `SELECT
          id,
          email,
          usuario,
          edad,
          altura_cm,
          sexo,
          peso_actual,
          peso_deseado,
          imc,
          objetivo,
          fecha_creacion,
          fecha_ultima_actividad,
          email_verificado
        FROM usuarios
        ORDER BY fecha_creacion DESC
        LIMIT $1 OFFSET $2
        `,
        [limite, offset],
      )
      // Contar total de usuarios
      const countResult = await query("SELECT COUNT(*) FROM usuarios")
      const total = Number.parseInt(countResult.rows[0].count)
      return {
        usuarios: result.rows,
        total,
        limite,
        offset,
        totalPaginas: Math.ceil(total / limite),
      }
    } catch (error) {
      console.error("Error obteniendo todos los usuarios:", error.message)
      throw error
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
}
module.exports = UsuariosModel
