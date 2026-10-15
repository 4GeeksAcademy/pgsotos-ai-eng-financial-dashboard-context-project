# Pruebas deterministas

## Alcance
- `backend/tests/` (`conftest.py`, `test_routes.py`), ejecutados con `pytest`.
- `frontend/src/lib/*.test.ts`, ejecutados con `vitest`.

## Justificación
Los tests actuales dependen de datos aleatorios con seed y no cubren el bug de zona horaria (`findings.md`, H6 y H1).

## Guía específica del proyecto

### R11. Los tests construyen sus propios datos o fijan el conjunto
- **Hecho:** `test_b2b_endpoint_combines_new_filters` asume que existen registros con B2B + outcome + suppliers, y eso depende de la seed 42 y de las probabilidades de `_build_movement` (H6). Con seed 42 hay 17 movimientos de esa combinación; con otras seeds varía (24, 10, 17 y 25 con las seeds 1, 2, 3 y 7), así que el test pasa por azar.
- **Mal:** afirmar `assert payload` sobre una combinación que solo existe por azar.
- **Bien:** crear los movimientos en el propio test, o sustituir la dependencia de datos (ver `architecture.md`, R5).
- Comandos: `cd backend && pytest` (hoy pasan 15 tests).
- **Estado:** deuda por corregir.

### R12. Todo cambio de fechas en el frontend lleva un test con `TZ` distinta de UTC
- **Hecho:** el test de `computeMonthlyData` en `financial-utils.test.ts` usa solo fechas a mitad de mes (días 3, 5 y 8), por lo que no detecta el bug de zona horaria (H1). El único día 1 (`2024-02-01`) está en `sampleMovements`, que solo se usa en `computeKPIs`, donde el mes no importa. Emulado con `node`, `2024-02-01` solo cambia de mes en `America/Santiago`.
- Añadir al test de `computeMonthlyData` un movimiento en día 1 (por ejemplo `2025-10-01`) y otro en el último día del mes.
- Ejecutar: `cd frontend && TZ=America/Santiago npm test`, además de la ejecución normal.
- Este test debe fallar antes de corregir H1 y pasar después.
- **Estado:** deuda por corregir.
