
Drop table usuarios;

CREATE TYPE tipo_sexo AS ENUM ('masculino', 'femenino');
CREATE TYPE tipo_token AS ENUM ('email_verification', 'password_reset');
-- Tabla de usuarios
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
    CONSTRAINT check_fecha_nacimiento CHECK (
        fecha_nacimiento <= CURRENT_DATE - INTERVAL '13 years'
    ),
    CONSTRAINT check_email_formato CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

-- Tabla de tokens de verificación (para email y reset de contraseña)
CREATE TABLE tokens_verificacion (
    id_token BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    tipo tipo_token NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expira_en TIMESTAMPTZ NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    usado_en TIMESTAMPTZ
);

 -- Índices para mejor rendimiento

CREATE INDEX idx_token ON tokens_verificacion(token);

CREATE INDEX idx_usuario_tipo ON tokens_verificacion (id_usuario, tipo);

CREATE INDEX idx_expira_en ON tokens_verificacion (expira_en);

-- Función para limpiar tokens expirados automáticamente
CREATE OR REPLACE FUNCTION limpiar_tokens_expirados() RETURNS INTEGER AS $$
DECLARE tokens_eliminados INTEGER;
BEGIN
DELETE FROM tokens_verificacion
WHERE expira_en < NOW()
    OR usado = true;
GET DIAGNOSTICS tokens_eliminados = ROW_COUNT;
RETURN tokens_eliminados;
END;
$$ LANGUAGE plpgsql;
-- Crear un job para limpiar tokens expirados cada hora (opcional)
-- Esto requerirá pg_cron o un cron job externo en producción