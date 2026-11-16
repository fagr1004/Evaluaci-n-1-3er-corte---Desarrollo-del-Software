-- ============================================================================
-- BASE DE DATOS: PLATAFORMA DE GESTIÓN Y AUDITORÍA FTTH-GPON (MUNICIPIO PLAZA)
-- ============================================================================

DROP DATABASE IF EXISTS PLATAFORMA_GESTION;
CREATE DATABASE PLATAFORMA_GESTION CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE PLATAFORMA_GESTION;

-- 1. Tabla de Usuarios (Roles: admin, tecnico)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'tecnico') NOT NULL DEFAULT 'tecnico',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Catálogo de Sectores del Municipio Plaza (Guarenas, Estado Miranda)
CREATE TABLE sectores_plaza (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_sector VARCHAR(100) NOT NULL,
    parroquia VARCHAR(80) NOT NULL DEFAULT 'Guarenas',
    lat_centro DECIMAL(10, 7) NOT NULL,
    lng_centro DECIMAL(10, 7) NOT NULL
);

-- 3. Inventario Maestro de Cajas NAP
CREATE TABLE cajas_nap (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_nap VARCHAR(30) NOT NULL UNIQUE,
    sector_id INT NOT NULL,
    direccion_referencia VARCHAR(200) NOT NULL,
    latitud DECIMAL(10, 7) NOT NULL,
    longitud DECIMAL(10, 7) NOT NULL,
    capacidad_puertos INT NOT NULL CHECK (capacidad_puertos IN (8, 16)),
    splitter_tipo VARCHAR(20) NOT NULL DEFAULT '1:8',
    potencia_troncal_dbm DECIMAL(5, 2) NOT NULL DEFAULT -18.50,
    estado_operativo ENUM('optimo', 'advertencia', 'critico', 'sin_auditar') NOT NULL DEFAULT 'sin_auditar',
    fecha_instalacion DATE NOT NULL,
    CONSTRAINT fk_nap_sector FOREIGN KEY (sector_id) REFERENCES sectores_plaza(id) ON DELETE RESTRICT
);

-- 4. Detalle de Puertos Individuales por Caja NAP
CREATE TABLE puertos_nap (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nap_id INT NOT NULL,
    numero_puerto INT NOT NULL,
    estado ENUM('disponible', 'ocupado', 'dañado', 'reservado') NOT NULL DEFAULT 'disponible',
    cliente_nombre VARCHAR(120) DEFAULT NULL,
    cliente_contrato VARCHAR(50) DEFAULT NULL,
    ont_serial VARCHAR(60) DEFAULT NULL,
    potencia_puerto_dbm DECIMAL(5, 2) DEFAULT NULL,
    CONSTRAINT fk_puerto_nap FOREIGN KEY (nap_id) REFERENCES cajas_nap(id) ON DELETE CASCADE,
    UNIQUE KEY uk_nap_puerto (nap_id, numero_puerto)
);

-- 5. Historial de Auditorías Técnicas bajo Estándar ITU-T G.984 (GPON)
CREATE TABLE auditorias_tecnicas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nap_id INT NOT NULL,
    tecnico_id INT NOT NULL,
    fecha_auditoria DATETIME DEFAULT CURRENT_TIMESTAMP,
    potencia_medida_dbm DECIMAL(5, 2) NOT NULL,
    atenuacion_calculada_db DECIMAL(5, 2) NOT NULL,
    resultado_gpon ENUM('optimo', 'advertencia', 'critico') NOT NULL,
    sellado_hermetico_ok BOOLEAN NOT NULL DEFAULT TRUE,
    etiquetado_fibras_ok BOOLEAN NOT NULL DEFAULT TRUE,
    reserva_cable_ok BOOLEAN NOT NULL DEFAULT TRUE,
    diagnostico_tecnico VARCHAR(255) NOT NULL,
    observaciones TEXT,
    CONSTRAINT fk_audit_nap FOREIGN KEY (nap_id) REFERENCES cajas_nap(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_tecnico FOREIGN KEY (tecnico_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

-- ============================================================================
-- DATOS PRECARGADOS (MUNICIPIO PLAZA - GUARENAS)
-- ============================================================================

INSERT INTO usuarios (id, nombre, email, password, rol) VALUES
(1, 'Ing. Carlos Mendoza', 'admin@ftthplaza.ve', 'admin123', 'admin'),
(2, 'Téc. Luis Ramírez', 'tecnico1@ftthplaza.ve', 'tec123', 'tecnico'),
(3, 'Téc. Andrea Gómez', 'tecnico2@ftthplaza.ve', 'tec123', 'tecnico'),
(4, 'Téc. Rafael Bolívar', 'tecnico3@ftthplaza.ve', 'tec123', 'tecnico');

INSERT INTO sectores_plaza (id, nombre_sector, parroquia, lat_centro, lng_centro) VALUES
(1, 'Nueva Casarapa', 'Guarenas', 10.4638000, -66.5785000),
(2, 'Urb. 27 de Febrero', 'Guarenas', 10.4712000, -66.6124000),
(3, 'Trapichito', 'Guarenas', 10.4685000, -66.6050000),
(4, 'Villa Panamericana', 'Guarenas', 10.4590000, -66.5880000),
(5, 'Las Clavellinas', 'Guarenas', 10.4755000, -66.6190000);

INSERT INTO cajas_nap (id, codigo_nap, sector_id, direccion_referencia, latitud, longitud, capacidad_puertos, splitter_tipo, potencia_troncal_dbm, estado_operativo, fecha_instalacion) VALUES
(1, 'NAP-PLZ-001', 1, 'Sector El Portal, Poste P-14, Nueva Casarapa', 10.4642000, -66.5779000, 8, '1:8', -19.20, 'optimo', '2026-01-15'),
(2, 'NAP-PLZ-002', 2, 'Bloque 12, Av. Principal, Urb. 27 de Febrero', 10.4718000, -66.6131000, 16, '1:16', -22.50, 'advertencia', '2026-02-10'),
(3, 'NAP-PLZ-003', 3, 'Calle 4 con Vereda 8, Sector Trapichito', 10.4681000, -66.6042000, 8, '1:8', -28.40, 'critico', '2026-03-05'),
(4, 'NAP-PLZ-004', 4, 'Torre C, Estacionamiento Norte, Villa Panamericana', 10.4595000, -66.5872000, 8, '1:8', -18.80, 'optimo', '2026-04-20'),
(5, 'NAP-PLZ-005', 5, 'Calle Real, Frente a Módulo Policial, Las Clavellinas', 10.4761000, -66.6184000, 16, '1:16', -21.10, 'optimo', '2026-05-12'),
(6, 'NAP-PLZ-006', 1, 'Conjunto Residencial La Hacienda, Poste P-03, Nueva Casarapa', 10.4625000, -66.5801000, 8, '1:8', -20.00, 'sin_auditar', '2026-06-01');

-- Puertos NAP-PLZ-001 (8 puertos)
INSERT INTO puertos_nap (nap_id, numero_puerto, estado, cliente_nombre, cliente_contrato, ont_serial, potencia_puerto_dbm) VALUES
(1, 1, 'ocupado', 'Familia Rodríguez', 'CTR-1001', 'HWTC48A19201', -19.45),
(1, 2, 'ocupado', 'Inversiones Guarenas C.A.', 'CTR-1002', 'ZTEG99B20144', -19.60),
(1, 3, 'ocupado', 'María Elena Pérez', 'CTR-1003', 'HWTC48A19288', -19.30),
(1, 4, 'ocupado', 'Carlos Eduardo Soto', 'CTR-1004', 'HWTC48A19310', -19.55),
(1, 5, 'disponible', NULL, NULL, NULL, NULL),
(1, 6, 'reservado', 'Reserva Corporativa', 'RES-01', NULL, NULL),
(1, 7, 'disponible', NULL, NULL, NULL, NULL),
(1, 8, 'disponible', NULL, NULL, NULL, NULL);

-- Puertos NAP-PLZ-002 (16 puertos)
INSERT INTO puertos_nap (nap_id, numero_puerto, estado, cliente_nombre, cliente_contrato, ont_serial, potencia_puerto_dbm) VALUES
(2, 1, 'ocupado', 'José Gregorio Silva', 'CTR-2001', 'FHTT12C44011', -25.80),
(2, 2, 'ocupado', 'Panadería La Plaza', 'CTR-2002', 'FHTT12C44019', -26.10),
(2, 3, 'dañado', NULL, NULL, NULL, NULL),
(2, 4, 'ocupado', 'Lucía Fernández', 'CTR-2003', 'FHTT12C44055', -25.95),
(2, 5, 'disponible', NULL, NULL, NULL, NULL),
(2, 6, 'disponible', NULL, NULL, NULL, NULL),
(2, 7, 'disponible', NULL, NULL, NULL, NULL),
(2, 8, 'disponible', NULL, NULL, NULL, NULL),
(2, 9, 'disponible', NULL, NULL, NULL, NULL),
(2, 10, 'disponible', NULL, NULL, NULL, NULL),
(2, 11, 'disponible', NULL, NULL, NULL, NULL),
(2, 12, 'disponible', NULL, NULL, NULL, NULL),
(2, 13, 'disponible', NULL, NULL, NULL, NULL),
(2, 14, 'disponible', NULL, NULL, NULL, NULL),
(2, 15, 'disponible', NULL, NULL, NULL, NULL),
(2, 16, 'disponible', NULL, NULL, NULL, NULL);

-- Puertos NAP-PLZ-003 (8 puertos)
INSERT INTO puertos_nap (nap_id, numero_puerto, estado, cliente_nombre, cliente_contrato, ont_serial, potencia_puerto_dbm) VALUES
(3, 1, 'ocupado', 'Pedro Castillo', 'CTR-3001', 'HWTC77D10022', -28.90),
(3, 2, 'dañado', NULL, NULL, NULL, NULL),
(3, 3, 'dañado', NULL, NULL, NULL, NULL),
(3, 4, 'disponible', NULL, NULL, NULL, NULL),
(3, 5, 'disponible', NULL, NULL, NULL, NULL),
(3, 6, 'disponible', NULL, NULL, NULL, NULL),
(3, 7, 'disponible', NULL, NULL, NULL, NULL),
(3, 8, 'disponible', NULL, NULL, NULL, NULL);

-- Puertos NAP-PLZ-004 (8 puertos)
INSERT INTO puertos_nap (nap_id, numero_puerto, estado, cliente_nombre, cliente_contrato, ont_serial, potencia_puerto_dbm) VALUES
(4, 1, 'ocupado', 'Ana Sofía Martínez', 'CTR-4001', 'ZTEG88A55102', -18.95),
(4, 2, 'ocupado', 'Consultorio Odontológico Plaza', 'CTR-4002', 'ZTEG88A55118', -19.10),
(4, 3, 'disponible', NULL, NULL, NULL, NULL),
(4, 4, 'disponible', NULL, NULL, NULL, NULL),
(4, 5, 'disponible', NULL, NULL, NULL, NULL),
(4, 6, 'disponible', NULL, NULL, NULL, NULL),
(4, 7, 'disponible', NULL, NULL, NULL, NULL),
(4, 8, 'disponible', NULL, NULL, NULL, NULL);

-- Puertos NAP-PLZ-005 (16 puertos)
INSERT INTO puertos_nap (nap_id, numero_puerto, estado, cliente_nombre, cliente_contrato, ont_serial, potencia_puerto_dbm) VALUES
(5, 1, 'ocupado', 'Supermercado El Sol', 'CTR-5001', 'HWTC11B99001', -21.30),
(5, 2, 'ocupado', 'Familia Morales', 'CTR-5002', 'HWTC11B99002', -21.45),
(5, 3, 'ocupado', 'Taller Mecánico Miranda', 'CTR-5003', 'HWTC11B99003', -21.50),
(5, 4, 'disponible', NULL, NULL, NULL, NULL),
(5, 5, 'disponible', NULL, NULL, NULL, NULL),
(5, 6, 'disponible', NULL, NULL, NULL, NULL),
(5, 7, 'disponible', NULL, NULL, NULL, NULL),
(5, 8, 'disponible', NULL, NULL, NULL, NULL),
(5, 9, 'disponible', NULL, NULL, NULL, NULL),
(5, 10, 'disponible', NULL, NULL, NULL, NULL),
(5, 11, 'disponible', NULL, NULL, NULL, NULL),
(5, 12, 'disponible', NULL, NULL, NULL, NULL),
(5, 13, 'disponible', NULL, NULL, NULL, NULL),
(5, 14, 'disponible', NULL, NULL, NULL, NULL),
(5, 15, 'disponible', NULL, NULL, NULL, NULL),
(5, 16, 'disponible', NULL, NULL, NULL, NULL);

-- Puertos NAP-PLZ-006 (8 puertos - Sin auditar)
INSERT INTO puertos_nap (nap_id, numero_puerto, estado) VALUES
(6, 1, 'disponible'), (6, 2, 'disponible'), (6, 3, 'disponible'), (6, 4, 'disponible'),
(6, 5, 'disponible'), (6, 6, 'disponible'), (6, 7, 'disponible'), (6, 8, 'disponible');

-- Auditorías Técnicas iniciales
INSERT INTO auditorias_tecnicas (nap_id, tecnico_id, potencia_medida_dbm, atenuacion_calculada_db, resultado_gpon, sellado_hermetico_ok, etiquetado_fibras_ok, reserva_cable_ok, diagnostico_tecnico, observaciones) VALUES
(1, 2, -19.20, 0.35, 'optimo', TRUE, TRUE, TRUE, 'CUMPLIMIENTO ÓPTIMO (ITU-T G.984 Clase B+)', 'Caja limpia, empalmes por fusión protegidos y etiquetas legibles en todos los hilos.'),
(2, 3, -25.90, 3.40, 'advertencia', TRUE, FALSE, TRUE, 'ADVERTENCIA: Atenuación elevada (-25 a -27 dBm). Revisar limpieza de conectores SC/APC.', 'Se detecta suciedad en adaptador SC/APC y falta etiquetado en hilos 4 al 16.'),
(3, 2, -28.40, 5.90, 'critico', FALSE, FALSE, FALSE, 'FALLA CRÍTICA: Potencia fuera de umbral GPON (< -27 dBm). Posible macrocurvatura o daño en splitter.', 'Goma de sellado vencida con filtración de humedad y macrocurvatura en bandeja de fusión.'),
(4, 4, -18.80, 0.25, 'optimo', TRUE, TRUE, TRUE, 'CUMPLIMIENTO ÓPTIMO (ITU-T G.984 Clase B+)', 'Instalación nueva en poste de concreto con coca de reserva reglamentaria de 15 metros.'),
(5, 3, -21.10, 0.40, 'optimo', TRUE, TRUE, TRUE, 'CUMPLIMIENTO ÓPTIMO (ITU-T G.984 Clase B+)', 'Splitter 1:16 balanceado correctamente dentro de parámetros nominales.');
