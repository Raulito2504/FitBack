# 🏗️ Arquitectura del Proyecto FitBack

## 📋 Índice
- [Visión General](#-visión-general)
- [Arquitectura Cliente-Servidor](#-arquitectura-cliente-servidor)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Patrones de Diseño](#-patrones-de-diseño)
- [Flujo de Datos](#-flujo-de-datos)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Seguridad](#-seguridad)
- [Configuración](#-configuración)

## 🎯 Visión General

FitBack implementa una **arquitectura cliente-servidor** robusta siguiendo el patrón **MVC (Model-View-Controller)** y una **arquitectura en capas (Layered Architecture)**. El backend está construido con Node.js y Express, proporcionando una API REST para el manejo de autenticación y usuarios.

## 🌐 Arquitectura Cliente-Servidor

### **Lado Servidor (Backend) - Implementado**
- **API REST** con Express.js
- **Base de datos** PostgreSQL
- **Autenticación** JWT
- **Servicios externos** (SendGrid para emails)

### **Lado Cliente (Frontend) - Por implementar**
- Aplicación web (React/Vue/Angular)
- Aplicación móvil (React Native/Flutter)
- Aplicación desktop (Electron)

## 📁 Estructura del Proyecto

```
FitBack/
├── 🚀 PUNTO DE ENTRADA
│   ├── server.js              # Inicialización del servidor
│   ├── app.js                 # Configuración de Express
│   └── package.json           # Dependencias y scripts
│
├── ⚙️ CONFIGURACIÓN
│   ├── config/
│   │   ├── cors.js            # Configuración CORS
│   │   └── database.config.js # Pool de conexiones PostgreSQL
│
├── 🛡️ CAPA DE MIDDLEWARE
│   ├── middleware/
│   │   ├── Auth.Middleware.js      # Autenticación JWT
│   │   └── Usuarios.Middleware.js  # Validaciones de usuarios
│
├── 🌐 CAPA DE RUTAS
│   ├── routes/
│   │   ├── Auth.Route.js      # Endpoints de autenticación
│   │   └── Usuarios.Routes.js # Endpoints de usuarios
│
├── 🎮 CAPA DE CONTROLADORES
│   ├── controller/
│   │   ├── Auth.Controller.js      # Lógica de autenticación
│   │   └── Usuarios.Controller.js  # Lógica de usuarios
│
├── 🗄️ CAPA DE MODELOS
│   ├── model/
│   │   ├── Auth.Model.js      # Acceso a datos de auth
│   │   └── Usuarios.Model.js  # CRUD de usuarios
│
├── ⚙️ CAPA DE SERVICIOS
│   ├── services/
│   │   └── EmailService.js    # Servicio de emails
│
└── 📊 BASE DE DATOS
    └── Database.sql           # Esquema de la base de datos
```

## 🎨 Patrones de Diseño

### 1. **MVC (Model-View-Controller)**
```
📱 Cliente (View)
    ↕️ JSON/HTTP
🎮 Controller (Lógica de negocio)
    ↕️ 
🗄️ Model (Acceso a datos)
    ↕️
💾 PostgreSQL
```

### 2. **Layered Architecture (Arquitectura en Capas)**
```
🌐 Presentation Layer  → Routes
🎮 Business Layer      → Controllers
🗄️ Data Access Layer  → Models
⚙️ Service Layer       → Services
⚙️ Configuration Layer → Config
```

### 3. **Repository/DAO Pattern**
- **Auth.Model.js**: DAO para operaciones de autenticación
- **Usuarios.Model.js**: DAO para operaciones CRUD de usuarios

### 4. **Middleware Pattern**
- **Chain of Responsibility**: Los middlewares se ejecutan en secuencia
- **Interceptor Pattern**: Interceptan requests antes de llegar a controladores

### 5. **Service Layer Pattern**
- **EmailService**: Encapsula lógica de servicios externos
- **Separación de responsabilidades**: Servicios reutilizables

### 6. **Configuration Pattern**
- Configuración centralizada en archivos dedicados
- Variables de entorno para diferentes ambientes

## 🔄 Flujo de Datos

### **Request Flow (Flujo de Petición)**
```
1. 📱 Cliente envía HTTP Request
        ↓
2. 🛡️ CORS Middleware (cors.js)
        ↓
3. 🔐 Auth Middleware (verificación JWT)
        ↓
4. 📝 Validation Middleware (validación datos)
        ↓
5. 🌐 Router (Auth.Route.js / Usuarios.Routes.js)
        ↓
6. 🎮 Controller (lógica de negocio)
        ↓
7. 🗄️ Model (acceso a base de datos)
        ↓
8. 💾 PostgreSQL Database
        ↓
9. ⚙️ Service (si requiere servicio externo)
        ↓
10. 📱 Response al Cliente
```

### **Ejemplo Práctico - Login de Usuario**
```
POST /api/auth/login
    ↓
🛡️ authMiddleware.validarLogin
    ↓ (validación exitosa)
🎮 authController.loginUsuario
    ↓
🗄️ AuthModel.buscarUsuarioPorEmail
    ↓
💾 SELECT * FROM usuarios WHERE email = ?
    ↓
🔐 Comparación de contraseña (bcrypt)
    ↓
🎫 Generación de JWT
    ↓
📱 { success: true, token: "...", usuario: {...} }
```

## 🛠️ Tecnologías Utilizadas

### **Backend Framework**
- **Node.js**: Runtime de JavaScript
- **Express.js**: Framework web minimalista

### **Base de Datos**
- **PostgreSQL**: Base de datos relacional
- **pg**: Driver de PostgreSQL para Node.js

### **Autenticación y Seguridad**
- **JWT (jsonwebtoken)**: Tokens de autenticación
- **bcryptjs**: Hashing de contraseñas
- **helmet**: Headers de seguridad HTTP
- **cors**: Control de acceso entre dominios

### **Validación**
- **Joi**: Validación de esquemas
- **validator**: Validaciones adicionales

### **Servicios Externos**
- **SendGrid**: Servicio de emails
- **nodemailer**: Cliente de emails alternativo

### **Utilidades**
- **uuid**: Generación de IDs únicos
- **date-fns**: Manipulación de fechas
- **compression**: Compresión de respuestas
- **morgan**: Logging de requests
- **dotenv**: Variables de entorno

## 🔒 Seguridad

### **Medidas Implementadas**

1. **Autenticación JWT**
   - Tokens firmados con secreto
   - Expiración configurable
   - Verificación en cada request protegido

2. **Hashing de Contraseñas**
   - bcryptjs con salt rounds
   - Nunca se almacenan contraseñas en texto plano

3. **Headers de Seguridad**
   - Helmet.js para headers HTTP seguros
   - CORS configurado para dominios específicos

4. **Validación de Datos**
   - Joi para validación de esquemas
   - Sanitización de inputs
   - Límites en tamaño de requests

5. **Variables de Entorno**
   - Secretos almacenados en .env
   - Configuración por ambiente

### **Headers de Seguridad**
```javascript
// Implementados en app.js
helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
})
```

## ⚙️ Configuración

### **Variables de Entorno (.env)**
```env
# Base de Datos
DB_HOST=localhost
DB_USER=usuario
DB_PASSWORD=contraseña
DB_NAME=fitback_db
DB_PORT=5432

# JWT
JWT_SECRET=tu_secreto_super_seguro
JWT_EXPIRES_IN=24h

# SendGrid
SENDGRID_API_KEY=tu_api_key
SENDGRID_FROM_EMAIL=noreply@fitback.com

# Servidor
PORT=5005
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### **Pool de Conexiones**
```javascript
// config/database.config.js
max: 20,                    // Máximo 20 conexiones
idleTimeoutMillis: 30000,   // 30s timeout inactivo
connectionTimeoutMillis: 2000 // 2s timeout conexión
```

## 📈 Ventajas de esta Arquitectura

### ✅ **Escalabilidad**
- Fácil agregar nuevos endpoints
- Modular y extensible
- Pool de conexiones eficiente

### ✅ **Mantenibilidad**
- Separación clara de responsabilidades
- Código organizado por capas
- Fácil testing unitario

### ✅ **Seguridad**
- Múltiples capas de seguridad
- Autenticación robusta
- Validación estricta

### ✅ **Reutilización**
- Servicios reutilizables
- Middlewares modulares
- Configuración centralizada

## 🚀 Próximos Pasos

### **Mejoras Recomendadas**

1. **Testing**
   - Tests unitarios (Jest)
   - Tests de integración
   - Coverage reporting

2. **Documentación API**
   - Swagger/OpenAPI
   - Postman collections

3. **Monitoreo**
   - Logging estructurado (Winston)
   - Métricas de performance
   - Health checks

4. **DevOps**
   - Docker containerization
   - CI/CD pipelines
   - Environment management

5. **Cliente Frontend**
   - React/Vue/Angular app
   - Consumo de la API
   - Estado global (Redux/Vuex)

---

## 👨‍💻 Autor
**FitBack Development Team**

## 📄 Licencia
Este proyecto está bajo la licencia MIT.