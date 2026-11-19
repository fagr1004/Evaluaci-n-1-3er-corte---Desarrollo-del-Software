# 📡 Plataforma Digital para la Gestión Técnica y Auditoría de Cajas de Acceso Terminal (NAP) — FTTH-GPON

**Ubicación:** Municipio Plaza, Estado Miranda.  
**Asignatura:** Desarrollo del Software — Evaluación 1 (3er Corte).  

---

## 📋 Descripción del Sistema

Plataforma web diseñada para el registro, auditoría de conectividad y gestión técnica de infraestructura de red **FTTH-GPON** (cajas NAP, puertos, sectores y estados operativos).

* **Frontend:** HTML5, CSS3, JavaScript.
* **Backend:** Python 3.11+, FastAPI, Uvicorn.
* **Base de Datos:** MySQL / MariaDB (`PLATAFORMA_GESTION`) gestionada mediante **XAMPP**.

---

## 📂 Estructura del Repositorio

```text
Evaluaci-n-1-3er-corte---Desarrollo-del-Software/
├── leeme.txt
├── README.md
└── ftth-plaza-app/
    ├── database.sql          # Script SQL con las tablas y datos iniciales
    ├── backend/              # API REST en FastAPI
    │   ├── main.py           # Endpoints y lógica del servidor
    │   ├── database.py       # Configuración de conexión a MySQL (XAMPP)
    │   └── requirements.txt  # Dependencias de Python
    └── frontend/             # Interfaz gráfica de usuario
        └── index.html        # Página principal y conexión con la API	
