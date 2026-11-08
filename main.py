from fastapi import FastAPI

app = FastAPI(
    title="API de Gestión y Auditoría NAP",
    description="Sistema FTTH-GPON para el Municipio Plaza",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"mensaje": "Plataforma NAP - Municipio Plaza activa 🚀"}
