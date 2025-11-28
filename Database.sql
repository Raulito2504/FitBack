-- Recreating complete database schema with all required fields

CREATE DATABASE Fitlife;
\c Fitlife;

-- Tabla de usuarios con todos los campos necesarios
CREATE TABLE usuarios (
    -- Changed id from INT to SERIAL for auto-increment
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) UNIQUE NOT NULL,
    hash_contrasena VARCHAR(255) NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    edad INT,
    altura_cm DECIMAL(5,2),
    peso_actual DECIMAL(5,2), 
    peso_deseado DECIMAL(5,2),
    sexo BOOLEAN,
    imc DECIMAL,
    objetivo VARCHAR(50),
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_ultima_actividad TIMESTAMPTZ DEFAULT NOW(),
    -- Removed trailing comma that caused syntax error
    email_verificado BOOLEAN DEFAULT FALSE
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_usuario ON usuarios(usuario);
CREATE INDEX idx_usuarios_fecha_creacion ON usuarios(fecha_creacion);
