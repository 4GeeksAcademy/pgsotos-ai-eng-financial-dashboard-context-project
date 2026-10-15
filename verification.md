# Verificación del resumen del proyecto (Fase 1)

Fecha de verificación: 2026-10-14

Este documento deja el rastro de cómo se contrastó el resumen del proyecto con el código real.

## Método

- **Backend:** se ejecutó en un venv temporal fuera del repo (Python 3.14, `fastapi`, `httpx`, `pytest`). No se modificó ningún archivo del repositorio.
- **Frontend:** solo lectura de código. No hay `node_modules`, por lo que no se corrieron `npm test`, `lint` ni `build`.
- **Docker:** no se ejecutó `docker compose up`. Se revisaron `docker-compose.yml`, los Dockerfiles y `vite.config.ts`.

## Afirmaciones confirmadas

| Afirmación | Evidencia |
|---|---|
| El backend genera 360 movimientos, 30 por mes durante 12 meses | `generate_mock_movements(42)` devuelve 360; conteo por mes = 30 en los 12 meses |
| Los datos son deterministas | Cada endpoint llama a `generate_mock_movements(seed=42)` |
| Hay 10 endpoints | `backend/app/routes.py` líneas 243–378: `/health`, `/api/metrics`, `/facets`, `/summary`, `/categories/top`, `/comparison`, `/alerts`, `/b2b`, `/b2c` |
| Los tests del backend pasan | `pytest`: 15 passed, 1 warning (deprecación de `httpx` con `starlette.testclient`) |
| El frontend solo consume `/api/metrics` | `frontend/src/App.tsx:16`; `grep` de `API_BASE_URL` solo aparece en `App.tsx` |
| `VITE_API_BASE_URL` tiene valor vacío por defecto | `frontend/src/App.tsx:13` |
| KPIs y datos mensuales se calculan en el cliente | `computeKPIs` y `computeMonthlyData` en `frontend/src/lib/financial-utils.ts` |
| El segundo gráfico se titula "Profit Margin %" | `profit-percent-chart.tsx:70` |
| `mock-data.ts` no se usa | `grep` de `mock-data` y `mockMovements` fuera del propio archivo: sin resultados |
| Puertos, volúmenes y comandos de Docker | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile` |
| El proxy de Vite apunta a `http://backend:8000` | `frontend/vite.config.ts` |

## Correcciones al resumen original

1. **Rango de fechas.** Se dijo "últimos 12 meses desde hoy". Con fecha actual 2026-10-14, los datos van de **2025-10-02 a 2026-09-28**. `_year_for_month` asigna el año actual a los meses anteriores al mes en curso y el año anterior al resto, así que el mes en curso cae un año atrás y el rango siempre termina antes del mes actual.
2. **Etiqueta de período.** `DashboardHeader` tiene por defecto `'2024 — Full Year'` (guion largo), pero `App.tsx` pasa `"2024 - Full Year"` (guion corto), que es lo que se muestra. En ambos casos no coincide con los datos (2025–2026).
3. **Distribución de datos desbalanceada.**
   - Categorías: sales 175, others 67, administrative 46, operational 40, suppliers 32.
   - Tipo de negocio: B2B 203, B2C 157.
4. **`random.seed` global.** No es tanto un problema de hilos como que reinicia el estado global de `random` en cada request.

## Sin verificar

- Compilación y tests del frontend (`npm install`, `npm test`, `npm run lint`, `npm run build`).
- Ejecución de punta a punta con `docker compose up --build`.

## Comandos usados

```bash
python3 -m venv <tmp>/venv && <tmp>/venv/bin/pip install fastapi httpx pytest
cd backend
<tmp>/venv/bin/python -c "from app.routes import *; m = generate_mock_movements(42); ..."
<tmp>/venv/bin/python -m pytest -q -p no:cacheprovider
grep -rn "mock-data\|mockMovements" frontend/src
grep -rn "API_BASE_URL" frontend/src
grep -n "@router" backend/app/routes.py
git status --short   # árbol limpio tras la verificación
```
