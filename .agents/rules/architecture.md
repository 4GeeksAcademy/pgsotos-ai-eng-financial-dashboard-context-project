# Arquitectura y contrato de datos

## Alcance
- `backend/app/routes.py`, `backend/app/main.py`.
- `frontend/src/lib/` (`financial-types.ts`, `financial-utils.ts`, `mock-data.ts`) y `frontend/src/App.tsx`.

## Justificación
Estas reglas vienen de hallazgos de arquitectura comprobados (`findings.md`, H5, H7, H12 y H13).

## Guía específica del proyecto

### R5. Los datos mock se generan en un solo punto y los endpoints los reciben como dependencia
- **Hecho:** `generate_mock_movements(seed=42)` se llama 8 veces en `routes.py` (líneas 255, 264, 277, 295, 311, 350, 370 y 386) y regenera los 360 movimientos en cada request (H5).
- **Mal:** `movements = generate_mock_movements(seed=42)` dentro de cada endpoint.
- **Bien:** una función de dependencia (`Depends`) que entregue los movimientos, de modo que sustituir el mock por datos reales o por un fixture de tests toque un solo lugar.
- **Estado:** deuda por corregir.

### R6. Usar una instancia propia de `random.Random`, no `random.seed()` global
- **Hecho:** `generate_mock_movements` llama a `random.seed(42)` y reinicia el estado global de `random` en cada request (H5).
- **Mal:** `random.seed(seed)` y luego `random.random()`.
- **Bien:** `rng = random.Random(seed)` y usar `rng.random()`, `rng.randint()`, `rng.choice()`.
- No introducir aleatoriedad en otras partes del backend: los tests dependen de la seed.
- **Estado:** deuda por corregir.

### R7. Cambiar el contrato en backend y frontend en el mismo commit
- **Hecho:** `FinancialMovement` se define a mano en `routes.py` (Pydantic) y en `frontend/src/lib/financial-types.ts`, con los mismos valores (`income`, `outcome`, las 5 categorías, `B2B` y `B2C`) (H7).
- Si se añade o renombra un campo o un valor, actualizar ambos archivos y los tests de los dos lados en el mismo commit.
- Contrastar con `http://localhost:8000/docs`, que muestra el esquema real.

### R8. Antes de crear lógica nueva en el frontend, comprobar si el backend ya la ofrece
- **Hecho:** el frontend usa solo `/api/metrics` (`App.tsx`) y recalcula en `financial-utils.ts` lo que `/api/metrics/summary` ya entrega. Existen también `/comparison`, `/alerts`, `/categories/top` y `/facets` (H12).
- **Mal:** sumar y agrupar movimientos por mes en el cliente.
- **Bien:** consumir el endpoint existente. Si falta un campo, ampliar el endpoint.
- **Límite actual:** `/summary` devuelve `income`, `outcome` y `net` por período, pero no `profitPercent` ni los totales de los KPI. Esos valores se derivan en el cliente a partir de los campos que sí entrega (`net / income`, y la suma de los períodos). Eso es aceptable; lo que la regla evita es volver a agrupar los movimientos.
- **Estado:** deuda por corregir (el frontend agrupa por mes en `computeMonthlyData` aunque `/summary` ya lo hace).

### R9. No dejar archivos sin importar
- **Hecho:** `frontend/src/lib/mock-data.ts` no lo importa ningún archivo (H12).
- Si se necesitan datos de ejemplo, van dentro del test que los usa.
- **Estado:** deuda por corregir (eliminar o usar `mock-data.ts`).

### R10. Los endpoints que solo difieren en un filtro se implementan con un parámetro
- **Hecho:** `/api/metrics/b2b` y `/api/metrics/b2c` (líneas 362–390 de `routes.py`) repiten el mismo código y solo cambia el literal `"B2B"` o `"B2C"` (H13). Además, `business_type` ya es parámetro en `summary`, `categories/top`, `comparison` y `alerts` (líneas 275, 293, 309 y 348). `get_metrics` (`/api/metrics`, línea 249) es el único endpoint de listado que no lo tiene.
- **Mal:** copiar un endpoint para cada valor.
- **Bien:** añadir `business_type` como parámetro opcional de `/api/metrics`, manteniendo `/b2b` y `/b2c` como alias si se necesita compatibilidad.
- **Estado:** deuda por corregir.
