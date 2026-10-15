# Corrección de datos y fechas

## Alcance
- `frontend/src/lib/financial-utils.ts` y cualquier código del frontend que lea `create_date`.
- `frontend/src/App.tsx` y `frontend/src/components/dashboard/dashboard-header.tsx` (textos de período).
- `backend/app/routes.py`: generación de fechas (`_year_for_month`, `generate_mock_movements`) y `build_metrics_facets`.

## Justificación
Las cuatro reglas vienen de comportamientos incorrectos comprobados en la verificación (`verification.md`) y listados en `findings.md` (H1–H4).

## Guía específica del proyecto

### R1. No parsear fechas `YYYY-MM-DD` con `new Date()` para extraer año o mes
- **Hecho:** con `TZ=America/Santiago`, `new Date("2025-10-01")` se lee como 2025-09-30 con `getMonth()`. El problema son dos líneas de `financial-utils.ts` que actúan juntas: el parseo en la línea 42 (`toYearMonthKey(new Date(m.create_date))`) y la lectura en hora local en `toYearMonthKey` (línea 7, `getFullYear` y `getMonth`). Los movimientos del día 1 caen en el mes anterior (H1).
- **Mal:** `new Date(m.create_date).getMonth()`
- **Bien:** `const [year, month] = m.create_date.split("-")` o usar `getUTCFullYear()` y `getUTCMonth()`. Hay que cambiar el parseo (línea 42) o la lectura (`toYearMonthKey`), no solo una de las dos.
- Todo cambio aquí requiere el test de `testing.md` (R12).
- **Estado:** deuda por corregir.

### R2. No escribir fijo ningún texto de período o fecha en la UI
- **Hecho:** `App.tsx` pasa `period="2024 - Full Year"` y el valor por defecto de `dashboard-header.tsx:7` es `'2024 — Full Year'`, pero los datos van de 2025-10-02 a 2026-09-28 (H2).
- **Mal:** `<DashboardHeader period="2024 - Full Year" />`
- **Bien:** derivar el texto de `min_date` y `max_date` de `GET /api/metrics/facets`, o de los propios movimientos.
- **Estado:** deuda por corregir. El código actual no cumple esta regla.

### R3. La lógica que depende de la fecha actual recibe `today` como parámetro
- **Hecho:** `_year_for_month(month, today)` ya recibe `today`, pero `generate_mock_movements` lo obtiene con `date.today()`. Con fecha 14/10 los datos terminan en 2026-09 y el mes en curso cae un año atrás (H3).
- **Mal:** llamar a `date.today()` dentro de funciones de generación o cálculo.
- **Bien:** `generate_mock_movements(seed=42, today=date(2026, 10, 14))`, con `today` opcional y `date.today()` solo en el valor por defecto.
- **Estado:** deuda por corregir.

### R4. Toda función que acceda a `[0]` o `[-1]` maneja la lista vacía
- **Hecho:** `build_metrics_facets` usa `ordered[0]` y `ordered[-1]` y lanza `IndexError` si no hay movimientos (H4).
- **Mal:** `min_date=ordered[0].create_date`
- **Bien:** comprobar `if not ordered:` y devolver un valor definido o un error HTTP controlado (por ejemplo, 404).
- **Estado:** deuda por corregir.
