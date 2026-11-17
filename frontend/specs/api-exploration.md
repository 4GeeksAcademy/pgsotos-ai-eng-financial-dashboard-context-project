# Exploración de la API (Fase 1)

Evidencia para las tres funcionalidades del PM. Cada hecho sale del esquema OpenAPI que genera `app.openapi()` (el mismo que sirve `/docs`) y de llamadas con `TestClient` a `backend/app/routes.py`. No hay campos inventados.

- **Fecha de la exploración:** 2026-11-16. Los datos mock dependen de `date.today()` (hallazgo H3 de `findings.md`), así que los rangos cambian con la fecha.
- **Rango actual de `GET /api/metrics/facets`:** `min_date` 2025-11-01, `max_date` 2026-10-28.
- **Convención:** las fechas viajan como `YYYY-MM-DD` y los límites son inclusivos (`>= start_date` y `<= end_date`).

## Endpoints usados

| Funcionalidad | Endpoint | Parámetros de query (todos opcionales salvo indicación) | Respuesta |
|---|---|---|---|
| 1. Filtro de fechas | `GET /api/metrics/facets` | ninguno | `MetricsFacets` |
| 1. Filtro de fechas | `GET /api/metrics` | `start_date`, `end_date`, `category`, `operation_type` | `FinancialMovement[]` |
| 1. Filtro de fechas | `GET /api/metrics/summary` | `group_by` (`day`/`week`/`month`, def. `month`), `start_date`, `end_date`, `category`, `operation_type`, `business_type` | `MetricsSummaryItem[]` |
| 2. Alertas | `GET /api/metrics/alerts` | `threshold` (número, `>= 0`, def. `0.3`), `group_by`, `start_date`, `end_date`, `business_type` | `MetricsAlert[]` |
| 3. B2B vs B2C | `GET /api/metrics/categories/top` | `operation_type` (def. **`outcome`**), `limit` (1–20, def. 5), `start_date`, `end_date`, `business_type` | `TopCategoryItem[]` |
| 3. B2B vs B2C | `GET /api/metrics/facets` | ninguno | `MetricsFacets` |

Esquemas de respuesta (campos exactos):

- `MetricsFacets`: `operation_types[]`, `business_types[]`, `categories[]`, `min_date`, `max_date`.
- `MetricsAlert`: `period`, `outcome_total`, `baseline_average`, `increase_ratio`.
- `TopCategoryItem`: `category`, `operation_type`, `total_amount`.
- Valores válidos: `business_type` = `B2B` | `B2C`; `operation_type` = `income` | `outcome`; `category` = `suppliers` | `sales` | `operational` | `administrative` | `others`.

Patrón de fetch existente en el frontend: `fetch("/api/...")` a través del proxy de Vite, en `frontend/src/App.tsx` y `frontend/src/lib/`. Solo se usa `/api/metrics`.

## Desajustes entre el texto del PM y la API

| # | El PM dice | La API hace (evidencia) | Impacto |
|---|---|---|---|
| D1 | Umbral de alerta entre `0.01` y `1.0` | `threshold` solo exige `>= 0`; sin máximo. `5` devuelve 200 con `[]`; `-1` devuelve 422 | El rango `0.01–1.0` lo debe imponer la UI |
| D2 | "Media móvil de los 3 períodos anteriores" | `baseline_average` es el promedio de **todos** los períodos anteriores dentro del rango (`detect_outcome_alerts`) | La columna no es una media móvil de 3 |
| D3 | "Incremento porcentual" | `increase_ratio` es una razón (`1.4968` = 149,68 %) | La UI debe multiplicar por 100 |
| D4 | Nada sobre agrupar por período | `group_by` existe (def. `month`). Los períodos son `YYYY-MM`, `YYYY-Www` o `YYYY-MM-DD` | La spec debe fijar el valor de `group_by` |
| D5 | Alertas respetan el rango de fechas | Cierto, pero el primer período del rango nunca alerta y el promedio se recalcula solo con el rango | Con una sola fecha o rango corto hay menos alertas (con `start_date=2026-03-01` hay 1) |
| D6 | "5 categorías de ingreso" por línea de negocio | Con `operation_type=income` solo existen `sales` y `others`: **2 filas** en B2B y en B2C. Con `outcome` hay 4 | Nunca habrá 5 filas |
| D7 | Tabla de **ingresos** | `categories/top` usa `operation_type=outcome` por defecto | La UI debe enviar `operation_type=income` explícito |
| D8 | "Porcentaje sobre el total del grupo" | La respuesta solo trae `total_amount`; no hay porcentaje ni total del grupo | El porcentaje se calcula en el cliente con la suma de `total_amount` |
| D9 | Gráfico con el total de ingresos B2B frente a B2C | Ningún endpoint devuelve ese total. `/comparison` compara el **neto** entre dos períodos consecutivos, no entre líneas de negocio | El total sale de sumar `total_amount` por línea |
| D10 | Categorías por grupo desde facetas | `facets.categories` es global (las 5), igual para B2B y B2C | No filtra por línea de negocio ni por tipo de operación |
| D11 | Rango válido de fechas | `start_date > end_date` devuelve 200 con `[]` (summary) y ceros con `delta_pct: null` (comparison); fecha inválida devuelve 422 | La UI debe validar el orden |

## Hallazgos fuera de alcance

Los hallazgos H1–H13 de `findings.md` siguen sin corregir: este proyecto solo especifica. No se tocó backend ni frontend.
