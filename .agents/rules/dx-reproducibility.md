# Builds reproducibles

## Alcance
- `backend/requirements.txt`, `backend/Dockerfile`.
- `frontend/package.json`, `frontend/package-lock.json`, `frontend/Dockerfile`.

## Justificación
Las dependencias del backend no tienen versión y la imagen del frontend instala sin respetar el lockfile (`findings.md`, H8).

## Guía específica del proyecto

### R14. Dependencias con versión fija y `npm ci` en Docker
- **Hecho:** `requirements.txt` lista `fastapi`, `uvicorn[standard]`, `debugpy`, `pytest`, `pytest-cov` y `httpx` sin versión. `frontend/Dockerfile` usa `npm install` aunque existe `package-lock.json` (H8).
- **Mal:** `fastapi` y `RUN npm install`.
- **Bien:** `fastapi==<versión>` y `RUN npm ci`.
- Al añadir una dependencia nueva, fijar su versión en el mismo commit.
- Las versiones de Python y Node de los Dockerfiles (3.13 y 24) son la referencia. Probar en esas versiones, no en la del equipo local.
- **Estado:** deuda por corregir.
