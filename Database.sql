-- Recreating complete database schema with all required fields

CREATE DATABASE Fitlife;
\c Fitlife;

-- Tipos ENUM para campos específicos
CREATE TYPE tipo_sexo AS ENUM ('masculino', 'femenino', 'otro');
CREATE TYPE tipo_objetivo AS ENUM ('bajar peso', 'mantener', 'tonificar');

-- Tabla de usuarios con todos los campos necesarios
CREATE TABLE usuarios (
    id_usuario BIGSERIAL PRIMARY KEY,
    email VARCHAR(320) UNIQUE NOT NULL,
    hash_contrasena VARCHAR(255) NOT NULL,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    
    -- Campos del perfil (pueden ser NULL hasta que el usuario complete su perfil)
    fecha_nacimiento DATE,
    sexo tipo_sexo,
    peso_actual DECIMAL(5,2), -- Peso en kg (ej: 75.50)
    peso_deseado DECIMAL(5,2), -- Peso deseado en kg
    objetivo tipo_objetivo,
    
    -- Campos de sistema
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_ultima_actividad TIMESTAMPTZ DEFAULT NOW(),
    email_verificado BOOLEAN DEFAULT FALSE,
    es_premium BOOLEAN DEFAULT FALSE,
	
    -- Restricciones (Constraints) para validar los datos de entrada
    CONSTRAINT check_fecha_nacimiento CHECK (fecha_nacimiento IS NULL OR fecha_nacimiento <= CURRENT_DATE - INTERVAL '13 years'),
    CONSTRAINT check_email_formato CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT check_peso_actual CHECK (peso_actual IS NULL OR (peso_actual >= 30 AND peso_actual <= 300)),
    CONSTRAINT check_peso_deseado CHECK (peso_deseado IS NULL OR (peso_deseado >= 30 AND peso_deseado <= 300))
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_nombre_usuario ON usuarios(nombre_usuario);
CREATE INDEX idx_usuarios_fecha_creacion ON usuarios(fecha_creacion);
