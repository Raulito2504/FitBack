const { query, getClient } = require("../config/database.config")
const bcrypt = require("bcryptjs")

class UsuariosModel {
  // =================================
  // FUNCIONES DE CONSULTA
  // =================================

  // Buscar usuario por email
  static async buscarPorEmail(email) {
    try {
      const result = await query(
        "SELECT id, email, usuario, edad, altura_cm, peso_kg, sexo, imc, objetivo, fecha_creacion, email_verificado FROM usuarios WHERE email = $1",
        [email],
      )
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
      const result = await query(
        "SELECT id, email, usuario, edad, altura_cm, peso_kg, sexo, imc, objetivo, fecha_creacion, email_verificado FROM usuarios WHERE usuario = $1",
        [usuario],
      )
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
        "SELECT id, email, usuario, edad, altura_cm, peso_kg, sexo, imc, objetivo, fecha_creacion, email_verificado FROM usuarios WHERE id = $1",
        [id],
      )
      return result.rows[0] || null
    } catch (error) {
      console.error("Error buscando usuario por ID:", error.message)
      throw error
    }
  }

  // Obtener todos los usuarios con paginación
  static async obtenerTodos(limite = 50, offset = 0) {
    try {
      const result = await query(
        `SELECT id, email, usuario, edad, altura_cm, peso_kg, sexo, imc, objetivo, fecha_creacion, email_verificado 
                FROM usuarios 
                ORDER BY fecha_creacion DESC 
                LIMIT $1 OFFSET $2`,
        [limite, offset],
      )

      const countResult = await query("SELECT COUNT(*) FROM usuarios")
      const total = Number.parseInt(countResult.rows[0].count)

      return {
        usuarios: result.rows,
        total,
        pagina: Math.floor(offset / limite) + 1,
        totalPaginas: Math.ceil(total / limite),
      }
    } catch (error) {
      console.error("Error obteniendo todos los usuarios:", error.message)
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
  // FUNCIONES DE ACTUALIZACIÓN
  // =================================

  // Actualizar perfil de usuario
  static async actualizarPerfil(id, datosActualizacion) {
    try {
      const camposPermitidos = ["edad", "altura_cm", "peso_kg", "objetivo"]
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

      // Recalcular IMC si se actualizó altura o peso
      if (datosActualizacion.altura_cm || datosActualizacion.peso_kg) {
        // Obtener valores actuales
        const usuarioActual = await this.buscarPorId(id)
        const altura_cm = datosActualizacion.altura_cm || usuarioActual.altura_cm
        const peso_kg = datosActualizacion.peso_kg || usuarioActual.peso_kg

        const altura_m = altura_cm / 100
        const imc = (peso_kg / (altura_m * altura_m)).toFixed(2)

        campos.push(`imc = $${contador}`)
        valores.push(imc)
        contador++
      }

      // Añadir ID del usuario
      valores.push(id)

      const result = await query(
        `UPDATE usuarios 
                SET ${campos.join(", ")}
                WHERE id = $${contador}
                RETURNING id, email, usuario, edad, altura_cm, peso_kg, sexo, imc, objetivo, fecha_creacion, email_verificado`,
        valores,
      )

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
                SET hash_contrasena = $1
                WHERE id = $2
                RETURNING id`,
        [hash_contrasena, id],
      )

      return result.rows[0]
    } catch (error) {
      console.error("Error cambiando contraseña:", error.message)
      throw error
    }
  }

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
