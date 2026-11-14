# NeuroFAI

## Requisitos

- Node.js
- Python 3.13 (con TensorFlow, ver `backend/requirements.txt`)

## Ejecución en local

Desde la raíz del repositorio:

```bash
# 1. Instalar dependencias de Node (solo la primera vez)
npm install

# 2. Crear el entorno de Python (solo la primera vez)
python3.13 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt

# 3. Levantar el servidor (con el venv activado)
source backend/venv/bin/activate
node backend/server.js
```

Abrir **http://localhost:3000** en el navegador.
