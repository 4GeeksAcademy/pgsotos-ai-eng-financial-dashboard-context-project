# Overview del producto

Cada afirmación cita su fuente. Lo que no tiene soporte en el repo está en la sección de afirmaciones rechazadas.

## Qué es
- Un dashboard de métricas financieras con frontend en React + TypeScript y backend en FastAPI (`README.es.md`, línea 18).
- Es un proyecto de formación de 4Geeks Academy: el README pide hacer fork, abrirlo en Codespaces o en local, y documentar reglas y banco de memoria (`README.es.md`, pasos recomendados, líneas 22–26).
- La interfaz se presenta como "Financial Overview" y "Executive metrics dashboard" (`frontend/src/components/dashboard/dashboard-header.tsx`, líneas 15–16).

## Qué muestra
- 4 KPIs: Total Income, Total Outcome, Profit y Profit Margin (`frontend/src/components/dashboard/kpi-row.tsx`).
- 2 gráficos mensuales: "Income vs. Outcome" y "Profit Margin %" (`income-outcome-chart.tsx` y `profit-percent-chart.tsx`).
- Los KPIs y los datos mensuales se calculan en el cliente a partir de `GET /api/metrics` (`frontend/src/App.tsx`, `frontend/src/lib/financial-utils.ts`).

## De dónde salen los datos
- Son datos mock generados en memoria por `generate_mock_movements` en `backend/app/routes.py`: 360 movimientos (30 por mes durante 12 meses), deterministas con `seed=42`.
- Cada movimiento tiene fecha, monto, tipo (`income` u `outcome`), categoría (`suppliers`, `sales`, `operational`, `administrative`, `others`) y tipo de negocio (`B2B` o `B2C`) (`backend/app/routes.py`, modelo `FinancialMovement`).
- Con fecha del sistema 2026-10-14, el rango generado fue 2025-10-02 a 2026-09-28 (`../verification.md`).

## Qué ofrece el backend
10 endpoints en `backend/app/routes.py`: `/health`, `/api/metrics`, `/api/metrics/facets`, `/api/metrics/summary`, `/api/metrics/categories/top`, `/api/metrics/comparison`, `/api/metrics/alerts`, `/api/metrics/b2b` y `/api/metrics/b2c`. El frontend solo consume `/api/metrics`.

## Afirmaciones rechazadas (sin soporte en el repo)
- Usuarios, clientes o casos de uso reales: ningún archivo los menciona.
- Producción, despliegue, autenticación o persistencia: no hay base de datos, CI (`.github/`) ni configuración de despliegue.
- Una "empresa" concreta detrás de los datos: el código no define ninguna; solo genera movimientos aleatorios.
- Métricas de negocio, objetivos de producto u hoja de ruta: no existe ningún documento que los respalde.
