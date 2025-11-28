# 🔐 Sistema de Autenticación FitBack

## 📋 Índice
1. [Características del Sistema](#-características-del-sistema)
2. [Configuración Inicial](#-configuración-inicial)
3. [Endpoints de Autenticación](#-endpoints-de-autenticación)
4. [Flujos de Usuario](#-flujos-de-usuario)
5. [Ejemplos de Uso](#-ejemplos-de-uso)
6. [Manejo de Errores](#-manejo-de-errores)
7. [Sistema de Emails](#-sistema-de-emails)
8. [Base de Datos](#-base-de-datos)

---

## 🚀 Características del Sistema

### ✅ **Funcionalidades Implementadas**
- 📝 **Registro de usuarios** con validación completa
- 🔐 **Login/Logout** con JWT tokens
- ✉️ **Verificación de email** con tokens únicos
- 🔑 **Recuperación de contraseña** por email
- 🛡️ **Middleware de autenticación** para rutas protegidas
- 📧 **Sistema de emails** con SendGrid
- 🗄️ **Gestión de tokens** con expiración automática
- ⚡ **Refresh tokens** para renovar sesiones

### 🔧 **Tecnologías Utilizadas**
- **Backend**: Node.js + Express.js
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT (jsonwebtoken)
- **Validación**: Joi
- **Emails**: SendGrid
- **Encriptación**: bcryptjs
- **Seguridad**: Helmet, CORS

---

## ⚙️ Configuración Inicial

### 1. **Variables de Entorno (.env)**
```env
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=fitback

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro
JWT_EXPIRES_IN=120h

# SendGrid
SENDGRID_API_KEY=SG.tu_api_key_aqui
SENDGRID_FROM_EMAIL=tu_email@gmail.com

# Servidor
PORT=5005
NODE_ENV=development
```

### 2. **Instalación de Dependencias**
```bash
npm install express cors helmet compression morgan
npm install jsonwebtoken bcryptjs joi
npm install @sendgrid/mail
npm install pg uuid dotenv
```

### 3. **Estructura del Proyecto**
```
FitBack/
├── config/
│   ├── database.config.js
│   └── cors.js
├── controller/
│   └── Auth.Controller.js
├── middleware/
│   └── Auth.Middleware.js
├── model/
│   └── Auth.Model.js
├── routes/
│   └── Auth.Route.js
├── services/
│   └── EmailService.js
├── app.js
├── server.js
└── Database.sql
```

---

## 🛣️ Endpoints de Autenticación

### **Base URL**: `http://localhost:5005/api/auth`

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/registro` | Registrar nuevo usuario | ❌ |
| POST | `/login` | Iniciar sesión | ❌ |
| POST | `/logout` | Cerrar sesión | ✅ |
| GET | `/verificar-email/:token` | Verificar email con token | ❌ |
| POST | `/forgot-password` | Solicitar reset de contraseña | ❌ |
| POST | `/reset-password` | Cambiar contraseña con token | ❌ |
| POST | `/refresh-token` | Renovar JWT token | ✅ |
| GET | `/verificar-token` | Validar JWT token | ✅ |
| POST | `/verificar-email-disponible` | Verificar disponibilidad de email | ❌ |
| POST | `/verificar-username-disponible` | Verificar disponibilidad de username | ❌ |

---

## 🔄 Flujos de Usuario

### 1. **📝 Flujo de Registro**
```mermaid
graph TD
    A[Usuario envía datos] --> B[Validación de datos]
    B --> C[Verificar email/username únicos]
    C --> D[Crear usuario en BD]
    D --> E[Generar token de verificación]
    E --> F[Enviar email de verificación]
    F --> G[Devolver JWT para acceso inmediato]
```

### 2. **✉️ Flujo de Verificación de Email**
```mermaid
graph TD
    A[Usuario recibe email] --> B[Copia token del email]
    B --> C[Hace GET /verificar-email/token]
    C --> D[Validar token en BD]
    D --> E[Marcar email como verificado]
    E --> F[Eliminar token usado]
    F --> G[Respuesta de éxito]
```

### 3. **🔑 Flujo de Recuperación de Contraseña**
```mermaid
graph TD
    A[Usuario olvida contraseña] --> B[POST /forgot-password]
    B --> C[Verificar que email existe]
    C --> D[Generar token de reset]
    D --> E[Enviar email con token]
    E --> F[Usuario usa token en /reset-password]
    F --> G[Validar token y cambiar contraseña]
    G --> H[Enviar email de confirmación]
```

---

## 🧪 Ejemplos de Uso

### **1. 📝 Registro de Usuario**
```http
POST http://localhost:5005/api/auth/registro
Content-Type: application/json

{
    "email": "usuario@ejemplo.com",
    "password": "MiPassword123",
    "nombre_usuario": "usuario123",
    "nombre_completo": "Juan Pérez",
    "telefono": "123456789",
    "fecha_nacimiento": "1990-01-01",
    "sexo": "M"
}
```

**Respuesta exitosa:**
```json
{
    "success": true,
    "message": "Usuario registrado exitosamente. Revisa tu email para verificar tu cuenta.",
    "data": {
        "usuario": {
            "id_usuario": "1",
            "email": "usuario@ejemplo.com",
            "nombre_usuario": "usuario123",
            "email_verificado": false
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expiresIn": "120h",
        "emailEnviado": true
    }
}
```

### **2. 🔐 Login de Usuario**
```http
POST http://localhost:5005/api/auth/login
Content-Type: application/json

{
    "email": "usuario@ejemplo.com",
    "password": "MiPassword123"
}
```

**Respuesta exitosa:**
```json
{
    "success": true,
    "message": "Login exitoso",
    "data": {
        "usuario": {
            "id_usuario": "1",
            "email": "usuario@ejemplo.com",
            "nombre_usuario": "usuario123",
            "email_verificado": true
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expiresIn": "120h"
    }
}
```

### **3. ✉️ Verificar Email**
```http
GET http://localhost:5005/api/auth/verificar-email/abc123xyz789token
```

**Respuesta exitosa:**
```json
{
    "success": true,
    "message": "Email verificado exitosamente. Tu cuenta está ahora activa.",
    "data": {
        "emailVerificado": true,
        "fecha": "2025-09-30T17:13:01.742Z"
    }
}
```

### **4. 🔑 Solicitar Reset de Contraseña**
```http
POST http://localhost:5005/api/auth/forgot-password
Content-Type: application/json

{
    "email": "usuario@ejemplo.com"
}
```

**Respuesta:**
```json
{
    "success": true,
    "message": "Si el email existe, recibirás instrucciones para resetear tu contraseña",
    "data": {
        "emailEnviado": true,
        "fecha": "2025-09-30T17:47:45.836Z"
    }
}
```

### **5. 🔄 Cambiar Contraseña con Token**
```http
POST http://localhost:5005/api/auth/reset-password
Content-Type: application/json

{
    "token": "token_del_email_de_recuperacion",
    "nuevaPassword": "MiNuevaPassword123"
}
```

**Respuesta exitosa:**
```json
{
    "success": true,
    "message": "Contraseña actualizada exitosamente",
    "data": {
        "passwordActualizada": true,
        "fecha": "2025-09-30T17:47:45.836Z"
    }
}
```

### **6. 🛡️ Usar Rutas Protegidas**
```http
GET http://localhost:5005/api/usuarios/perfil
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ❌ Manejo de Errores

### **Errores Comunes de Validación**
```json
{
    "success": false,
    "message": "Datos de entrada inválidos",
    "errores": [
        {
            "campo": "email",
            "mensaje": "El email debe ser válido",
            "valorRecibido": "email_invalido"
        }
    ]
}
```

### **Errores de Autenticación**
```json
{
    "success": false,
    "message": "Token no proporcionado",
    "code": "NO_TOKEN"
}
```

```json
{
    "success": false,
    "message": "Token expirado",
    "code": "TOKEN_EXPIRED"
}
```

### **Errores de Email Duplicado**
```json
{
    "success": false,
    "message": "Email ya registrado",
    "code": "EMAIL_EXISTS"
}
```

---

## 📧 Sistema de Emails

### **Tipos de Emails Enviados**

1. **✅ Email de Verificación de Cuenta**
   - **Asunto**: "🎉 Bienvenido a FitBack - Verifica tu cuenta"
   - **Contiene**: Token para verificar email
   - **Expira**: 24 horas

2. **🔐 Email de Recuperación de Contraseña**
   - **Asunto**: "🔐 Restablece tu contraseña - FitBack"
   - **Contiene**: Token para cambiar contraseña
   - **Expira**: 1 hora

3. **✅ Email de Confirmación de Cambio**
   - **Asunto**: "✅ Contraseña Actualizada - FitBack"
   - **Contiene**: Confirmación del cambio exitoso

### **Configuración de SendGrid**
```javascript
// En services/EmailService.js
class EmailService {
    static fromEmail = process.env.SENDGRID_FROM_EMAIL;
    static apiKey = process.env.SENDGRID_API_KEY;
    
    static getBaseConfig() {
        return {
            from: this.fromEmail,
            // Configuración base para todos los emails
        };
    }
}
```

### **Estructura de Email (Ejemplo)**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>/* Estilos CSS */</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Título del Email</h1>
        </div>
        <div class="content">
            <h2>Hola Usuario 👋</h2>
            <p>Contenido del mensaje...</p>
            
            <div class="token-box">
                <code>TOKEN_AQUI</code>
            </div>
            
            <p><strong>📝 Instrucciones:</strong></p>
            <ol>
                <li>Copia el token</li>
                <li>Usa la API correspondiente</li>
            </ol>
        </div>
    </div>
</body>
</html>
```

---

## 🗄️ Base de Datos

### **Tabla: usuarios**
```sql
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hash_contrasena VARCHAR(255) NOT NULL,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    sexo VARCHAR(20),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actividad TIMESTAMP,
    email_verificado BOOLEAN DEFAULT FALSE,
    es_premium BOOLEAN DEFAULT FALSE
);
```

### **Tabla: tokens_verificacion**
```sql
CREATE TABLE tokens_verificacion (
    id SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expira_en TIMESTAMP NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    usado_en TIMESTAMP
);
```

### **Tipos de Tokens**
- `email_verification`: Para verificar email de cuenta
- `password_reset`: Para cambiar contraseña
- `first_login_verification`: Para verificar primer login (opcional)

### **Índices y Funciones**
```sql
-- Índices para optimización
CREATE INDEX idx_tokens_token ON tokens_verificacion(token);
CREATE INDEX idx_tokens_usuario_tipo ON tokens_verificacion(id_usuario, tipo);
CREATE INDEX idx_tokens_expira ON tokens_verificacion(expira_en);

-- Función para limpiar tokens expirados
CREATE OR REPLACE FUNCTION limpiar_tokens_expirados()
RETURNS INTEGER AS $$
DECLARE
    tokens_eliminados INTEGER;
BEGIN
    DELETE FROM tokens_verificacion 
    WHERE expira_en < NOW() OR usado = TRUE;
    
    GET DIAGNOSTICS tokens_eliminados = ROW_COUNT;
    RETURN tokens_eliminados;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔒 Seguridad Implementada

### **1. Encriptación de Contraseñas**
- **Algoritmo**: bcrypt con 12 salt rounds
- **Verificación**: Comparación hash segura

### **2. JWT Tokens**
- **Algoritmo**: HS256
- **Expiración**: Configurable (default: 120h)
- **Payload**: userId, email, username, verificado

### **3. Validación de Datos**
- **Joi schemas** para todos los endpoints
- **Sanitización** de inputs
- **Validación de tipos** y formatos

### **4. Rate Limiting de Tokens**
- **Tokens únicos** por usuario y tipo
- **Expiración automática**
- **Limpieza periódica** de tokens expirados

### **5. Headers de Seguridad**
- **Helmet.js** para headers seguros
- **CORS** configurado
- **Compresión** de respuestas

---

## 🚀 Iniciar el Sistema

### **1. Preparar Base de Datos**
```bash
# Crear base de datos
createdb fitback

# Ejecutar script SQL
psql -U postgres -d fitback -f Database.sql
```

### **2. Configurar Variables de Entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### **3. Instalar Dependencias**
```bash
npm install
```

### **4. Iniciar Servidor**
```bash
npm start
# o
node server.js
```

### **5. Verificar Funcionamiento**
```bash
# Health check
curl http://localhost:5005/api/health
```

---

## 📝 Notas Importantes

### **⚠️ Para Desarrollo**
- Los emails muestran el token directamente (sin frontend)
- Logs detallados en consola para debugging
- Errores incluyen stack trace en development

### **🔄 Para Producción**
- Configurar `NODE_ENV=production`
- Usar HTTPS para todas las comunicaciones
- Configurar domains apropiados en SendGrid
- Implementar rate limiting
- Configurar logging robusto

### **📧 Personalización de Emails**
- Los templates están en `services/EmailService.js`
- Fácil personalización de estilos y contenido
- Soporte para variables dinámicas

### **🔧 Mantenimiento**
- Ejecutar limpieza de tokens periódicamente
- Monitorear logs de SendGrid
- Backup regular de base de datos

---

## 🤝 Contribución

Para agregar nuevas funcionalidades:

1. Crear nueva ruta en `Auth.Route.js`
2. Implementar lógica en `Auth.Controller.js`
3. Agregar validación en `Auth.Middleware.js`
4. Actualizar modelo en `Auth.Model.js`
5. Agregar tests correspondientes

---

## 📞 Soporte

Si encuentras problemas:

1. Verificar configuración de `.env`
2. Comprobar conexión a base de datos
3. Validar configuración de SendGrid
4. Revisar logs del servidor
5. Verificar estructura de base de datos

---

**🎉 ¡El sistema de autenticación FitBack está listo para usar!**