create database Fitlife;
\c Fitlife;
CREATE TYPE tipo_sexo AS ENUM ('masculino', 'femenino');

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



