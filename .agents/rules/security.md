# Seguridad de la API

## Alcance
- `backend/app/main.py` (middleware CORS).

## Justificación
CORS está abierto a cualquier origen y con credenciales (`findings.md`, H11).

## Guía específica del proyecto

### R13. No combinar `allow_origins=["*"]` con `allow_credentials=True`
- **Hecho:** `main.py` configura `allow_origins=["*"]` y `allow_credentials=True` a la vez (H11). Comprobado con `TestClient`: una petición con `Origin: http://evil.example` recibe `access-control-allow-origin: http://evil.example` y `access-control-allow-credentials: true`, incluso sin cookie. El servidor refleja cualquier origen con credenciales.
- **Mal:** orígenes comodín con credenciales.
- **Bien:** leer los orígenes permitidos de una variable de entorno (por ejemplo `CORS_ORIGINS`), con `http://localhost:5173` por defecto en desarrollo.
- En desarrollo local el frontend usa el proxy de Vite (`/api` → `backend:8000`), por lo que CORS no es necesario en ese flujo.
- **Estado:** deuda por corregir. Revisar antes de cualquier despliegue.
