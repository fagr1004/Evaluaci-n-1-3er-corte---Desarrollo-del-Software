from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import date
from database import get_db_connection

app = FastAPI(
    title="API Gestión y Auditoría FTTH-GPON - Municipio Plaza",
    description="Plataforma técnica para inventario y auditoría de cajas NAP en Guarenas, Estado Miranda.",
    version="1.0.0"
)

# Permitir peticiones desde el frontend (GitHub Pages o entorno local)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# MODELOS DE VALIDACIÓN (PYDANTIC)
# ============================================================================

class LoginRequest(BaseModel):
    email: str
    password: str

class CajaNapCreate(BaseModel):
    codigo_nap: str
    sector_id: int
    direccion_referencia: str
    latitud: float
    longitud: float
    capacidad_puertos: int
    splitter_tipo: str
    potencia_troncal_dbm: float
    fecha_instalacion: date

class PuertoUpdate(BaseModel):
    estado: str
    cliente_nombre: Optional[str] = None
    cliente_contrato: Optional[str] = None
    ont_serial: Optional[str] = None
    potencia_puerto_dbm: Optional[float] = None

class AuditoriaCreate(BaseModel):
    nap_id: int
    tecnico_id: int
    potencia_medida_dbm: float
    sellado_hermetico_ok: bool
    etiquetado_fibras_ok: bool
    reserva_cable_ok: bool
    observaciones: Optional[str] = ""

# ============================================================================
# MOTOR DE EVALUACIÓN ESTÁNDAR ITU-T G.984 (GPON CLASE B+)
# ============================================================================

def evaluar_estandar_gpon(potencia_medida: float, potencia_troncal: float):
    atenuacion = round(abs(potencia_medida - potencia_troncal), 2)

    if -25.0 <= potencia_medida <= -8.0:
        return (
            "optimo",
            atenuacion,
            "CUMPLIMIENTO ÓPTIMO (ITU-T G.984 Clase B+)"
        )
    elif -27.0 <= potencia_medida < -25.0:
        return (
            "advertencia",
            atenuacion,
            "ADVERTENCIA: Atenuación elevada (-25 a -27 dBm). Revisar limpieza de conectores SC/APC."
        )
    elif potencia_medida > -8.0:
        return (
            "critico",
            atenuacion,
            "FALLA CRÍTICA: Riesgo de saturación óptica en receptor ONT (> -8 dBm)."
        )
    else:
        return (
            "critico",
            atenuacion,
            "FALLA CRÍTICA: Potencia fuera de umbral GPON (< -27 dBm). Posible macrocurvatura o daño en splitter."
        )

# ============================================================================
# ENDPOINTS DE LA API
# ============================================================================

@app.get("/")
def root():
    return {"mensaje": "API FTTH-GPON Municipio Plaza operativa"}

@app.post("/api/login")
def login(data: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, nombre, email, rol FROM usuarios WHERE email = %s AND password = %s",
        (data.email, data.password)
    )
    usuario = cursor.fetchone()
    cursor.close()
    conn.close()

    if not usuario:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return usuario

@app.get("/api/dashboard")
def obtener_metricas():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT COUNT(*) AS total FROM cajas_nap")
    total_naps = cursor.fetchone()["total"]

    cursor.execute("""
        SELECT 
            COUNT(*) AS total_puertos,
            SUM(CASE WHEN estado = 'ocupado' THEN 1 ELSE 0 END) AS ocupados,
            SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) AS disponibles,
            SUM(CASE WHEN estado = 'dañado' THEN 1 ELSE 0 END) AS danados
        FROM puertos_nap
    """)
    puertos = cursor.fetchone()

    cursor.execute("""
        SELECT estado_operativo, COUNT(*) AS cantidad 
        FROM cajas_nap 
        GROUP BY estado_operativo
    """)
    estados = cursor.fetchall()

    cursor.close()
    conn.close()

    return {
        "total_naps": total_naps,
        "puertos": puertos,
        "estados_nap": estados
    }

@app.get("/api/sectores")
def listar_sectores():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM sectores_plaza ORDER BY nombre_sector")
    sectores = cursor.fetchall()
    cursor.close()
    conn.close()
    return sectores

@app.get("/api/naps")
def listar_naps():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT 
            c.*, 
            s.nombre_sector,
            (SELECT COUNT(*) FROM puertos_nap p WHERE p.nap_id = c.id AND p.estado = 'ocupado') AS puertos_ocupados,
            (SELECT COUNT(*) FROM puertos_nap p WHERE p.nap_id = c.id AND p.estado = 'disponible') AS puertos_disponibles
        FROM cajas_nap c
        INNER JOIN sectores_plaza s ON c.sector_id = s.id
        ORDER BY c.id DESC
    """
    cursor.execute(query)
    naps = cursor.fetchall()
    cursor.close()
    conn.close()
    return naps

@app.post("/api/naps")
def crear_nap(nap: CajaNapCreate):
    if nap.capacidad_puertos not in (8, 16):
        raise HTTPException(status_code=400, detail="La capacidad debe ser 8 o 16 puertos")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql_nap = """
            INSERT INTO cajas_nap 
            (codigo_nap, sector_id, direccion_referencia, latitud, longitud, capacidad_puertos, splitter_tipo, potencia_troncal_dbm, fecha_instalacion)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql_nap, (
            nap.codigo_nap.upper(), nap.sector_id, nap.direccion_referencia,
            nap.latitud, nap.longitud, nap.capacidad_puertos,
            nap.splitter_tipo, nap.potencia_troncal_dbm, nap.fecha_instalacion
        ))
        nap_id = cursor.lastrowid

        sql_puerto = "INSERT INTO puertos_nap (nap_id, numero_puerto, estado) VALUES (%s, %s, 'disponible')"
        puertos_data = [(nap_id, i) for i in range(1, nap.capacidad_puertos + 1)]
        cursor.executemany(sql_puerto, puertos_data)

        conn.commit()
        return {"mensaje": f"Caja {nap.codigo_nap} creada con {nap.capacidad_puertos} puertos", "id": nap_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/naps/{nap_id}")
def eliminar_nap(nap_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM cajas_nap WHERE id = %s", (nap_id,))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    if affected == 0:
        raise HTTPException(status_code=404, detail="Caja NAP no encontrada")
    return {"mensaje": "Caja NAP eliminada correctamente"}

@app.get("/api/naps/{nap_id}/puertos")
def obtener_puertos(nap_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM puertos_nap WHERE nap_id = %s ORDER BY numero_puerto", (nap_id,))
    puertos = cursor.fetchall()
    cursor.close()
    conn.close()
    return puertos

@app.put("/api/puertos/{puerto_id}")
def actualizar_puerto(puerto_id: int, data: PuertoUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()

    if data.estado == "disponible":
        data.cliente_nombre = None
        data.cliente_contrato = None
        data.ont_serial = None
        data.potencia_puerto_dbm = None

    sql = """
        UPDATE puertos_nap 
        SET estado = %s, cliente_nombre = %s, cliente_contrato = %s, ont_serial = %s, potencia_puerto_dbm = %s
        WHERE id = %s
    """
    cursor.execute(sql, (
        data.estado, data.cliente_nombre, data.cliente_contrato,
        data.ont_serial, data.potencia_puerto_dbm, puerto_id
    ))
    conn.commit()
    cursor.close()
    conn.close()
    return {"mensaje": "Puerto actualizado correctamente"}

@app.get("/api/auditorias")
def listar_auditorias():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT 
            a.*, 
            c.codigo_nap, 
            s.nombre_sector,
            u.nombre AS tecnico_nombre
        FROM auditorias_tecnicas a
        INNER JOIN cajas_nap c ON a.nap_id = c.id
        INNER JOIN sectores_plaza s ON c.sector_id = s.id
        INNER JOIN usuarios u ON a.tecnico_id = u.id
        ORDER BY a.fecha_auditoria DESC
    """
    cursor.execute(query)
    auditorias = cursor.fetchall()
    cursor.close()
    conn.close()
    return auditorias

@app.post("/api/auditorias")
def registrar_auditoria(audit: AuditoriaCreate):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT potencia_troncal_dbm FROM cajas_nap WHERE id = %s", (audit.nap_id,))
    nap = cursor.fetchone()
    if not nap:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Caja NAP no encontrada")

    resultado_gpon, atenuacion, diagnostico = evaluar_estandar_gpon(
        audit.potencia_medida_dbm, float(nap["potencia_troncal_dbm"])
    )

    try:
        sql_insert = """
            INSERT INTO auditorias_tecnicas 
            (nap_id, tecnico_id, potencia_medida_dbm, atenuacion_calculada_db, resultado_gpon, 
             sellado_hermetico_ok, etiquetado_fibras_ok, reserva_cable_ok, diagnostico_tecnico, observaciones)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql_insert, (
            audit.nap_id, audit.tecnico_id, audit.potencia_medida_dbm, atenuacion, resultado_gpon,
            audit.sellado_hermetico_ok, audit.etiquetado_fibras_ok, audit.reserva_cable_ok,
            diagnostico, audit.observaciones
        ))

        cursor.execute(
            "UPDATE cajas_nap SET estado_operativo = %s WHERE id = %s",
            (resultado_gpon, audit.nap_id)
        )

        conn.commit()
        return {
            "mensaje": "Auditoría registrada y estado de NAP actualizado",
            "resultado_gpon": resultado_gpon,
            "atenuacion_db": atenuacion,
            "diagnostico": diagnostico
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()