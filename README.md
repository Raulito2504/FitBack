# 🏋️‍♂️ FitBack API

Una API REST robusta para aplicaciones de fitness desarrollada con Node.js, Express y PostgreSQL. Diseñada con arquitectura modular separando autenticación de gestión de usuarios.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Base de Datos](#-base-de-datos)
- [Uso](#-uso)
- [Endpoints](#-endpoints)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Contribución](#-contribución)

## ✨ Características

- 🔐 **Autenticación JWT** completa (registro, login, logout, refresh)
- 👤 **Gestión de perfiles** de usuario
- 🛡️ **Validaciones robustas** con Joi
- 🗃️ **Base de datos PostgreSQL** con transacciones
- 🔒 **Seguridad** con Helmet y CORS
- 📊 **Logging detallado** para debugging
- 🏗️ **Arquitectura modular** y escalable
- ⚡ **Pool de conexiones** optimizado
- 📱 **API RESTful** con respuestas estandarizadas

## 🛠️ Tecnologías

- **Runtime:** Node.js
- **Framework:** Express.js 5.1.0
- **Base de Datos:** PostgreSQL
- **Autenticación:** JSON Web Tokens (JWT)
- **Validación:** Joi
- **Seguridad:** Helmet, CORS, bcryptjs
- **Utilidades:** Morgan, Compression, dotenv, UUID

## 🚀 Instalación

### Prerequisitos

- Node.js (v16 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/Raulito2504/FitBack.git
cd FitBack
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Copiar archivo de ejemplo
copy .env.example .env
```

4. **Configurar base de datos** (ver sección [Base de Datos](#-base-de-datos))

5. **Iniciar servidor**
```bash
npm start
# o para desarrollo
npm run dev
```

## ⚙️ Configuración

### Archivo `.env`

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Configuración del servidor
PORT=5005
NODE_ENV=development

# Configuración de la base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Fitlife
DB_USER=postgres
DB_PASSWORD=tu_password_aqui

# JWT Secret Key (¡CAMBIAR EN PRODUCCIÓN!)
JWT_SECRET=tu_jwt_secret_key_super_segura_aqui_cambiar_en_produccion
JWT_EXPIRES_IN=120h

# Configuración de CORS
FRONTEND_URL=http://localhost:5173
```

### Variables de Entorno Explicadas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto donde correrá el servidor | `5005` |
| `NODE_ENV` | Entorno de ejecución | `development` / `production` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos | `Fitlife` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `tu_password` |
| `JWT_SECRET` | Clave secreta para JWT | `clave_super_secreta` |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | `24h`, `120h` |
| `FRONTEND_URL` | URL del frontend para CORS | `http://localhost:3000` |

## 🗃️ Base de Datos

### Configuración PostgreSQL

1. **Crear base de datos**
```sql
CREATE DATABASE Fitlife;
```

2. **Conectar a la base de datos**
```sql
\c Fitlife;
```

3. **Crear tipo ENUM**
```sql
CREATE TYPE tipo_sexo AS ENUM ('masculino', 'femenino');
```

4. **Crear tabla usuarios**
```sql
CREATE TABLE usuarios (
    id_usuario BIGSERIAL PRIMARY KEY,
    email VARCHAR(320) UNIQUE NOT NULL,
    hash_contrasena VARCHAR(255) NOT NULL,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento DATE NOT NULL,
    sexo tipo_sexo NOT NULL,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_ultima_actividad TIMESTAMPTZ DEFAULT NOW(),
    email_verificado BOOLEAN DEFAULT FALSE,
    es_premium BOOLEAN DEFAULT FALSE,
    
    -- Restricciones (Constraints) para validar los datos de entrada
    CONSTRAINT check_fecha_nacimiento CHECK (fecha_nacimiento <= CURRENT_DATE - INTERVAL '13 years'),
    CONSTRAINT check_email_formato CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);
```

### Scripts SQL

Puedes encontrar el script completo de la base de datos en `Database.sql`

## 🎯 Uso

### Iniciar el Servidor

```bash
# Producción
npm start

# Desarrollo (con nodemon si está instalado)
npm run dev

# Alternativa directa
node server.js
```

### Verificar que el servidor esté funcionando

Visita: `http://localhost:5005`

Deberías ver:
```json
{
  "success": true,
  "message": "Bienvenido a FitBack API",
  "endpoints": {
    "auth": "/api/auth",
    "usuarios": "/api/usuarios",
    "health": "/api/health"
  }
}
```

### Health Check

Verifica el estado del servidor:
```
GET http://localhost:5005/api/health
```

## 📡 Endpoints

### 🔐 Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/registro` | Registrar nuevo usuario | ❌ |
| `POST` | `/login` | Iniciar sesión | ❌ |
| `POST` | `/logout` | Cerrar sesión | ✅ |
| `POST` | `/refresh-token` | Renovar token | ✅ |
| `GET` | `/verificar-token` | Validar token | ✅ |
| `POST` | `/verificar-email-disponible` | Verificar disponibilidad email | ❌ |
| `POST` | `/verificar-username-disponible` | Verificar disponibilidad username | ❌ |

### 👤 Usuarios (`/api/usuarios`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/perfil` | Obtener perfil usuario | ✅ |
| `PUT` | `/perfil` | Actualizar perfil | ✅ |
| `PUT` | `/cambiar-password` | Cambiar contraseña | ✅ |
| `GET` | `/estadisticas` | Estadísticas del usuario | ✅ |
| `DELETE` | `/eliminar-cuenta` | Eliminar cuenta | ✅ |
| `GET` | `/` | Listar usuarios (admin) | ✅ |
| `GET` | `/:id` | Obtener usuario por ID (admin) | ✅ |

### 📋 Ejemplos de Uso

#### Registro de Usuario
```bash
curl -X POST http://localhost:5005/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "MiPassword123!",
    "nombre_usuario": "usuario123",
    "nombre_completo": "Juan Pérez",
    "telefono": "+1234567890",
    "fecha_nacimiento": "1990-05-15",
    "sexo": "masculino"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "MiPassword123!"
  }'
```

#### Obtener Perfil (requiere token)
```bash
curl -X GET http://localhost:5005/api/usuarios/perfil \
  -H "Authorization: Bearer TU_TOKEN_JWT_AQUI"
```

## 🏗️ Estructura del Proyecto

```
FitBack/
├── 📄 app.js                 # Configuración principal de Express
├── 📄 server.js              # Punto de entrada del servidor
├── 📄 Database.sql           # Script de base de datos
├── 📄 .env                   # Variables de entorno (no en repo)
├── 📄 .env.example           # Ejemplo de variables de entorno
├── 📄 package.json           # Dependencias y scripts
├── 📄 README.md              # Este archivo
│
├── 📁 config/                # Configuraciones
│   ├── 📄 cors.js            # Configuración CORS
│   └── 📄 database.config.js # Configuración PostgreSQL
│
├── 📁 routes/                # Definición de rutas
│   ├── 📄 Auth.Route.js      # Rutas de autenticación
│   └── 📄 Usuarios.Routes.js # Rutas de usuarios
│
├── 📁 controller/            # Lógica de negocio
│   ├── 📄 Auth.Controller.js # Controlador de autenticación
│   └── 📄 Usuarios.Controller.js # Controlador de usuarios
│
├── 📁 middleware/            # Middlewares personalizados
│   ├── 📄 Auth.Middleware.js # Middleware de autenticación
│   └── 📄 Usuarios.Middleware.js # Middleware de usuarios
│
└── 📁 model/                 # Modelos de datos
    ├── 📄 Auth.Model.js      # Modelo de autenticación
    └── 📄 Usuarios.Model.js  # Modelo de usuarios
```

### Arquitectura

- **Separación de responsabilidades:** Auth vs Usuarios
- **Patrón MVC:** Modelo-Vista-Controlador
- **Middleware personalizado:** Validaciones y autenticación
- **Pool de conexiones:** Gestión optimizada de PostgreSQL
- **Manejo de errores:** Centralizado y detallado

## 🔒 Seguridad

- ✅ Hash de contraseñas con bcryptjs (salt rounds: 12)
- ✅ JWT con expiración configurable
- ✅ Validación de entrada con Joi
- ✅ Headers de seguridad con Helmet
- ✅ CORS configurado
- ✅ Sanitización de datos
- ✅ Rate limiting (recomendado para producción)

## 🧪 Testing

Para probar los endpoints puedes usar:

### Con cURL
```bash
# Health check
curl http://localhost:5005/api/health

# Registro
curl -X POST http://localhost:5005/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","nombre_usuario":"testuser","nombre_completo":"Test User","fecha_nacimiento":"1990-01-01","sexo":"masculino"}'
```

### Con Postman
1. Importa la colección (crear archivo .postman_collection.json)
2. Configura variable `baseUrl` = `http://localhost:5005`
3. Configura variable `token` para endpoints protegidos

### Con Thunder Client (VS Code)
- Instala la extensión Thunder Client
- Crea requests para cada endpoint
- Usa variables de entorno para token y baseUrl

## 🐛 Troubleshooting

### Problemas Comunes

1. **Error de conexión a PostgreSQL**
   - Verifica que PostgreSQL esté corriendo
   - Revisa las credenciales en `.env`
   - Asegúrate que la base de datos `Fitlife` exista

2. **Error "Puerto en uso"**
   ```bash
   # Encontrar proceso usando el puerto 5005
   netstat -ano | findstr 5005
   # Matar proceso
   taskkill /PID <número_proceso> /F
   ```

3. **Token JWT inválido**
   - Verifica que el `JWT_SECRET` sea el mismo
   - Revisa que el token no haya expirado
   - Asegúrate de enviar `Bearer <token>` en el header

4. **Errores de validación**
   - Revisa que todos los campos requeridos estén presentes
   - Verifica el formato de email y contraseña
   - Asegúrate que la edad sea mayor a 13 años

## 📚 Scripts Disponibles

```bash
# Iniciar servidor
npm start

# Modo desarrollo (si tienes nodemon instalado)
npm run dev

# Instalar dependencias
npm install

# Verificar dependencias
npm audit
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Autores

- **Arnoldo Rafael** - *Desarrollo inicial* - [Raulito2504](https://github.com/Raulito2504)

## 🙏 Agradecimientos

- Express.js community
- PostgreSQL team
- JWT.io
- Joi validation library

---

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa esta documentación
2. Busca en [Issues](https://github.com/Raulito2504/FitBack/issues)
3. Crea un nuevo issue con detalles del problema

---

**¡Happy coding! 🚀**