create database Fitlife;


CREATE TABLE usuarios (
    --Datos para el login
    id int PRIMARY KEY,
    email VARCHAR(320) UNIQUE NOT NULL,
    hash_contrasena VARCHAR(255) NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    --Datos para dietas y ejercicios
    edad int NOT NULL,
    altura_cm DECIMAL(5,2) NOT NULL,
    peso_kg DECIMAL(5,2) NOT NULL,
    sexo BOOLEAN NOT NULL, -- TRUE para masculino, FALSE para femenino
    imc DECIMAL(5,2) NOT NULL,
    objetivo VARCHAR(50) NOT NULL, -- 'bajar peso', 'mantener', 'tonificar'
    --Datos extras
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    email_verificado BOOLEAN DEFAULT FALSE
);

/* CREATE TABLE plan_ejercicios (
    id int PRIMARY KEY,
    id_usuario int PRIMARY KEY,
    id_ejercicio int PRIMARY KEY,

    foreign key (id_usuario) references usuarios(id),
    foreign key (id_ejercicio) references ejercicios(id)
);

CREATE TABLE plan_dietas (
    id int PRIMARY KEY,
    id_usuario int NOT NULL,
    id_dieta int NOT NULL,

    foreign key (id_usuario) references usuarios(id),
    foreign key (id_dieta) references dietas(id)
);

CREATE TABLE ejercicios (
    --Datos del ejercicio
    id int PRIMARY Key,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    video_url VARCHAR(255) NOT NUll,
    --Datos para el filtro
    imc DECIMAL(5,2) NOT NULL,
    objetivo VARCHAR(50) NOT NULL
);

CREATE TABLE dietas (
    --Datos de la dieta
    id int PRIMARY Key,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    imagen_url VARCHAR(255) NOT NULL,
    --Datos para el filtro
    imc DECIMAL(5,2) NOT NULL,
    objetivo VARCHAR(50) NOT NULL
);



