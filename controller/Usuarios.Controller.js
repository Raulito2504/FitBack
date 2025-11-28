const UsuariosModel = require("../model/Usuarios.Model")

class UsuariosController {
  // GESTIÓN DE PERFIL

  // => OBTIENE EL USUARIO ACTUAL.
  static async obtenerPerfil(req, res) {
    try {
      const usuario = await UsuariosModel.buscarPorId(req.usuario.id)
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        })
      }
      res.status(200).json({
        success: true,
        message: "Perfil obtenido exitosamente",
        data: { usuario },
      })
    } catch (error) {
      console.error("Error en obtenerPerfil:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }

  // => ACTUALIZA EL PERFIL DEL USUARIO

   static async actualizarPerfil(req, res) {
    try {
      const datosActualizacion = req.body

      if (datosActualizacion.altura_cm && datosActualizacion.peso_actual) {
        const alturaEnMetros = datosActualizacion.altura_cm / 100
        datosActualizacion.imc = Number.parseFloat(
          (datosActualizacion.peso_actual / (alturaEnMetros * alturaEnMetros)).toFixed(2),
        )
      }

      const usuarioActualizado = await UsuariosModel.actualizarPerfil(req.usuario.id, datosActualizacion)
      if (!usuarioActualizado) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        })
      }
      res.status(200).json({
        success: true,
        message: "Perfil actualizado exitosamente",
        data: { usuario: usuarioActualizado },
      })
    } catch (error) {
      console.error("Error en actualizarPerfil:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }

  static async completarPerfilProgresivo(req, res) {
    try {
      const datosActualizacion = req.body

      if (datosActualizacion.altura_cm && datosActualizacion.peso_actual) {
        const alturaEnMetros = datosActualizacion.altura_cm / 100
        datosActualizacion.imc = Number.parseFloat(
          (datosActualizacion.peso_actual / (alturaEnMetros * alturaEnMetros)).toFixed(2),
        )
      }
      const usuarioActualizado = await UsuariosModel.actualizarPerfil(req.usuario.id, datosActualizacion)
      if (!usuarioActualizado) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        })
      }
      res.status(200).json({
        success: true,
        message: "Perfil actualizado exitosamente",
        data: { usuario: usuarioActualizado },
      })
    } catch (error) {
      console.error("Error en completarPerfilProgresivo:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }

  // CAMBIAR CONTRASEÑA
  static async cambiarPassword(req, res) {
    try {
      const { passwordActual, passwordNueva } = req.body
      const usuario = await UsuariosModel.buscarPorEmailCompleto(req.usuario.email)
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        })
      }
      const passwordValida = await UsuariosModel.verificarPassword(passwordActual, usuario.hash_contrasena)
      if (!passwordValida) {
        return res.status(400).json({
          success: false,
          message: "La contraseña actual es incorrecta",
        })
      }
      await UsuariosModel.cambiarPassword(req.usuario.id, passwordNueva)
      res.status(200).json({
        success: true,
        message: "Contraseña cambiada exitosamente",
      })
    } catch (error) {
      console.error("Error en cambiarPassword:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }
  // ELIMINAR CUENTA
  static async eliminarCuenta(req, res) {
    try {
      const usuarioEliminado = await UsuariosModel.eliminar(req.usuario.id)
      if (!usuarioEliminado) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        })
      }
      res.status(200).json({
        success: true,
        message: "Cuenta eliminada exitosamente",
      })
    } catch (error) {
      console.error("Error en eliminarCuenta:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }
  // FUNCIONES ADMINISTRATIVAS
  // => OBTENER TODOS LOS USUARIOS
  static async obtenerTodosUsuarios(req, res) {
    try {
      const { pagina = 1, limite = 50 } = req.query
      const offset = (pagina - 1) * limite
      const resultado = await UsuariosModel.obtenerTodos(Number.parseInt(limite), Number.parseInt(offset))
      res.status(200).json({
        success: true,
        message: "Usuarios obtenidos exitosamente",
        data: resultado,
      })
    } catch (error) {
      console.error("Error en obtenerTodosUsuarios:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }

  // => OBTENER USUARIO POR ID
  static async obtenerUsuarioPorId(req, res) {
    try {
      const { id } = req.params
      const usuario = await UsuariosModel.buscarPorId(id)
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        })
      }
      res.status(200).json({
        success: true,
        message: "Usuario obtenido exitosamente",
        data: { usuario },
      })
    } catch (error) {
      console.error("Error en obtenerUsuarioPorId:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }

  // ESTADÍSTICAS Y DATOS ADICIONALES

  // OBTENER ESTADÍSTICAS DEL USUARIO
  static async obtenerEstadisticasUsuario(req, res) {
    try {
      const usuario = await UsuariosModel.buscarPorId(req.usuario.id)
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        })
      }
      const estadisticas = {
        fechaRegistro: usuario.fecha_creacion,
        ultimaActividad: usuario.fecha_ultima_actividad,
        emailVerificado: usuario.email_verificado,
        esPremium: usuario.es_premium,
        diasRegistrado: Math.floor((new Date() - new Date(usuario.fecha_creacion)) / (1000 * 60 * 60 * 24)),
      }
      res.status(200).json({
        success: true,
        message: "Estadísticas obtenidas exitosamente",
        data: { estadisticas },
      })
    } catch (error) {
      console.error("Error en obtenerEstadisticasUsuario:", error.message)
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }
  }
}

module.exports = UsuariosController
