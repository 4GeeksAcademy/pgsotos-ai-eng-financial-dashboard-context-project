# Verificación de las specs

Fecha: 2026-11-17. Rama `feature/frontend-specs`. Los datos del backend dependen de `date.today()` (hallazgo H3), así que los números de ejemplo corresponden a esta fecha.

## Cómo repetirla

```bash
# 1. Tipos (desde la carpeta de specs; sin salida y exit 0 si compila)
cd frontend && npm ci && cd specs && npx tsc --noEmit

# 2. Alcance de la rama (debe listar solo frontend/specs/*)
git diff --name-only main..HEAD

# 3. Backend: esquema OpenAPI y respuestas reales
cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt httpx
PYTHONPATH=. .venv/bin/python -c "from app.main import app; import json; print(json.dumps(app.openapi()['components']['schemas'], indent=1))"
```

Las respuestas se obtuvieron con `fastapi.testclient.TestClient(app)` (FastAPI 0.163.1) sobre `app.main:app`, el mismo esquema que sirve `/docs`.

## Contraste con el backend

| Afirmación de la spec | Resultado observado |
|---|---|
| `FacetsResponse` con 5 campos | `MetricsFacets` tiene `operation_types`, `business_types`, `categories`, `min_date`, `max_date`. Coincide. |
| `AlertEntry` con 4 campos | `MetricsAlert`: `period`, `outcome_total`, `baseline_average`, `increase_ratio`. Coincide. |
| `CategoryEntry` con 3 campos | `TopCategoryItem`: `category`, `operation_type`, `total_amount`. Coincide. |
| `FinancialMovement` con 5 campos | `create_date`, `amount`, `operation_type`, `category`, `business_type`, todos obligatorios. Coincide. |
| `threshold` acepta `>= 0`, defecto `0.3` | `minimum: 0`, `default: 0.3`. `threshold=-1` responde 422. |
| `limit` de 1 a 20, defecto `5` | `minimum: 1`, `maximum: 20`, `default: 5`. `limit=21` responde 422. |
| `group_by` `day`/`week`/`month`, defecto `month` | Coincide. |
| `operation_type` de `categories/top` con defecto `outcome` | Coincide. |
| Fecha vacía (`start_date=`) responde 422 | Confirmado (`date_from_datetime_parsing`). |
| Inicio posterior al fin responde 200 con `[]` | Confirmado. |
| `threshold=5` responde 200 con `[]` | Confirmado. |
| Cuerpo del 422 con `type`, `loc`, `msg`, `input`, `ctx` | Confirmado; no aparece `url`. |
| Facetas: mínimo 2025-11-01, máximo 2026-10-28 | Confirmado. |
| Ingresos solo `sales` y `others` (2 filas por línea); gastos 4 filas | Confirmado para B2B y B2C. |
| Meses incompletos (15-mar a 10-jun, `threshold=0.01`) | Abril: `outcome_total` 51665.68, `baseline_average` 18254.17, `increase_ratio` 1.8303. Mayo 0.1681 y junio 0.0887 también alertan. Coincide. |
| `GET /api/metrics` devuelve la lista de `FinancialMovement` | 360 filas sin filtros. Coincide. |

## Criterios de aceptación

| # | Criterio | Evidencia |
|---|---|---|
| 1 | Exploración trazable a `/docs` | `api-exploration.md` y la tabla anterior. |
| 2 | Interfaces coinciden con OpenAPI, sin `any` | Esquemas contrastados arriba; sin `any` ni `object` en el código de los `.ts`. |
| 3 | `DateRangeFilter` con dos `string` opcionales y JSDoc | `param-types.ts:14-18`. |
| 4 | Params extienden `DateRangeFilter` | `param-types.ts:22` y `:36`. |
| 5 | `components.md` con componentes, props y condicionales | 8 componentes con tablas de renderizado condicional. |
| 6 | Estado vacío de la tabla de anomalías | `components.md`, fila `entries.length === 0` de `AnomalyAlertsTable`. |
| 7 | Un solo input de fecha | `components.md`, filas "Solo `start_date`" y "Solo `end_date`". |
| 8 | Paneles B2B y B2C con top vacío | `components.md`, `CategoryTotalsTable` (`entries.length === 0`). |
| 9 | README con 3 funcionalidades y al menos 2 casos límite cada una | 5, 4 y 6 casos. |
| 10 | `npx tsc --noEmit` compila | `cd frontend/specs && npx tsc --noEmit` da exit 0 sobre 2 archivos. Prueba negativa: un error de tipo añadido a `api-types.ts` hace fallar el comando (exit 2, `TS2322`). |
| 11 | Commits significativos en `feature/frontend-specs` | Un commit por fase más correcciones; ninguno con atribución de IA. |
| 12 | Sin React, `fetch` ni backend | `git diff --name-only main..HEAD` lista solo `frontend/specs/*`. |

## Límites conocidos

- `npx tsc --noEmit` desde `frontend/` pasa pero no revisa `specs/`: el `tsconfig.json` raíz solo tiene referencias. Hay que ejecutarlo en `frontend/specs/`.
- No se levantó el servidor con `uvicorn`: el esquema y las respuestas se obtuvieron con `TestClient`, que ejecuta la misma aplicación.
