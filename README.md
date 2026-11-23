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

## Google Drive

Para guardar y abrir proyectos desde Google Drive, copiar `backend/.env.example` a `backend/.env` y completar:

| Variable | Dónde se obtiene en Google Cloud Console |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Credenciales: ID de cliente OAuth (aplicación web, origen `http://localhost:3000`) |
| `GOOGLE_API_KEY` | Credenciales: Clave de API (restringida a Drive API y Picker API) |
| `GOOGLE_APP_ID` | Número del proyecto (se obtiene en panel principal) |

El proyecto de Google Cloud necesita habilitadas Google Drive API y Google Picker API. Mientras la pantalla de consentimiento esté en modo prueba, solo pueden iniciar sesión las cuentas agregadas como usuarios de prueba.

Sin `backend/.env`, la app funciona igual pero las opciones de Google Drive avisan que no está configurado.
