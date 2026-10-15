# Hallazgos de ingeniería y reglas propuestas (Fase 2)

Este documento reúne los hallazgos derivados de la inspección del backend y el frontend (ver `verification.md`) y las reglas propuestas a partir de ellos. Cada hallazgo apunta a un archivo, línea o comportamiento concreto. Cada regla cita al menos un hecho del repo.

Las reglas son propuestas. Se convertirán en archivos de `.agents/rules/` en la Fase 3.

## Hallazgos

### Correctness

| ID | Hallazgo | Ubicación |
|---|---|---|
| H1 | `new Date("YYYY-MM-DD")` se interpreta en UTC y luego se lee con `getMonth()` local. Con `TZ=America/Santiago`, `2025-10-01` pasa a `2025-09-30` y el movimiento cae en el mes anterior | `frontend/src/lib/financial-utils.ts`, `toYearMonthKey` |
| H2 | La etiqueta de período dice "2024 - Full Year" y los datos van de 2025-10-02 a 2026-09-28 | `frontend/src/App.tsx`, `frontend/src/components/dashboard/dashboard-header.tsx:7` |
| H3 | El año de cada mes depende de la fecha actual: `generate_mock_movements` lee `date.today()` y se lo pasa a `_year_for_month(month, today)`. El mes en curso siempre cae un año atrás | `backend/app/routes.py`, `generate_mock_movements` (línea 97) y `_year_for_month` (línea 65) |
| H4 | `build_metrics_facets` lanza `IndexError` si la lista de movimientos está vacía | `backend/app/routes.py`, `ordered[0]` y `ordered[-1]` |

### Arquitectura

| ID | Hallazgo | Ubicación |
|---|---|---|
| H5 | `random.seed(42)` reinicia el estado global de `random`, y 8 endpoints regeneran los 360 movimientos en cada request | `backend/app/routes.py`, líneas 255, 264, 277, 295, 311, 350, 370, 386 |
| H7 | `FinancialMovement` y sus valores (`income`, `outcome`, categorías, `B2B`/`B2C`) están definidos a mano en Python y en TypeScript | `backend/app/routes.py`, `frontend/src/lib/financial-types.ts` |
| H12 | `mock-data.ts` no lo importa ningún archivo, y el frontend consume 1 de los 10 endpoints | `frontend/src/lib/mock-data.ts`, `frontend/src/App.tsx` |
| H13 | `/b2b` y `/b2c` repiten el mismo código y varían solo en el literal | `backend/app/routes.py`, líneas 362–390 |

### Testing

| ID | Hallazgo | Ubicación |
|---|---|---|
| H6 | Hay tests que asumen que existe una combinación exacta de datos (B2B + outcome + suppliers). Cambiar la seed puede dejarlos en rojo | `backend/tests/test_routes.py`, `test_b2b_endpoint_combines_new_filters` |

H1 no lo detectan los tests actuales: el test de `computeMonthlyData` en `financial-utils.test.ts` usa solo fechas a mitad de mes (días 3, 5 y 8) y no fija la zona horaria. El único día 1 (`2024-02-01`) está en `sampleMovements`, que solo se usa en `computeKPIs`.

### Seguridad

| ID | Hallazgo | Ubicación |
|---|---|---|
| H11 | `allow_origins=["*"]` junto con `allow_credentials=True` | `backend/app/main.py` |

### DX y reproducibilidad

| ID | Hallazgo | Ubicación |
|---|---|---|
| H8 | `requirements.txt` no fija versiones y el Dockerfile del frontend usa `npm install` en lugar de `npm ci` | `backend/requirements.txt`, `frontend/Dockerfile` |

### Frontend y UX

| ID | Hallazgo | Ubicación |
|---|---|---|
| H9 | `className="dark"` está fijo, por lo que el modo claro definido en `index.css` nunca se usa | `frontend/src/App.tsx:46` |
| H10 | `.catch(() => setError(...))` descarta el error original y no lo registra | `frontend/src/App.tsx` |

### Naming y Documentation

Sin hallazgos concretos. No se inventaron hallazgos para estas categorías.

### Resumen

| Categoría | IDs | Cantidad |
|---|---|---|
| Correctness | H1, H2, H3, H4 | 4 |
| Arquitectura | H5, H7, H12, H13 | 4 |
| Testing | H6 | 1 |
| Seguridad | H11 | 1 |
| DX y reproducibilidad | H8 | 1 |
| Frontend y UX | H9, H10 | 2 |
| Naming | — | 0 |
| Documentation | — | 0 |

## Hallazgos descartados

- `routes.py` mezcla modelos, datos y lógica: es una opinión de diseño y no un defecto puntual.
- `ensure_chronological_order` es redundante: es inocuo.
- Los commits previos mezclan idiomas: no hay un archivo al que apuntar.
- Comillas inconsistentes entre `App.tsx` y `dashboard/*.tsx`: impacto bajo.
- Dos `.gitignore` (raíz y `frontend/`) con entradas repetidas: impacto bajo.

## Reglas propuestas

### Correctness

| ID | Regla | Hecho del repo que la respalda |
|---|---|---|
| R1 | Las fechas `YYYY-MM-DD` no se parsean con `new Date()` para extraer año o mes. Se separan con `split("-")` o se usa `getUTC*` | `financial-utils.ts`: con `TZ=America/Santiago`, `new Date("2025-10-01")` da 2025-09-30 (H1) |
| R2 | Ningún texto de período o fecha se escribe fijo en la UI. Se deriva de los datos o del endpoint `/api/metrics/facets` | `App.tsx` pasa `"2024 - Full Year"` y los datos van de 2025-10-02 a 2026-09-28 (H2) |
| R3 | La lógica que use la fecha actual recibe `today` como parámetro y no llama a `date.today()` dentro de la función | `generate_mock_movements` llama a `date.today()` (línea 97) y con fecha 14/10 el mes en curso cae un año atrás (H3) |
| R4 | Toda función que acceda a `[0]` o `[-1]` de una lista maneja el caso vacío | `build_metrics_facets` usa `ordered[0]` y `ordered[-1]` y falla con lista vacía (H4) |

### Arquitectura

| ID | Regla | Hecho del repo que la respalda |
|---|---|---|
| R5 | Los datos mock se generan en un solo punto. Los endpoints los reciben como dependencia (`Depends`) y no llaman al generador | 8 llamadas a `generate_mock_movements(seed=42)` en `routes.py` (H5) |
| R6 | Se usa una instancia propia, `random.Random(seed)`, y no `random.seed()` global | `generate_mock_movements` llama a `random.seed(42)` y reinicia el estado global (H5) |
| R7 | Si se cambia `FinancialMovement` o sus valores, se actualizan en el mismo commit `routes.py` y `financial-types.ts` | Ambos definen `income`, `outcome`, las 5 categorías y `B2B`/`B2C` a mano (H7) |
| R8 | Antes de crear código nuevo en el frontend, se comprueba si el backend ya tiene el endpoint (`/summary`, `/comparison`, `/alerts`…). No se recalculan agregados en el cliente | El frontend usa 1 de 10 endpoints y recalcula en `financial-utils.ts` lo que ya hace `/summary` (H12) |
| R9 | No se dejan archivos sin importar. Si se necesitan datos de ejemplo, van en el test que los usa | `lib/mock-data.ts` no lo importa nadie (H12) |
| R10 | Los endpoints que solo difieren en un filtro se implementan con un parámetro, sin copiar el cuerpo | `/b2b` y `/b2c` repiten el mismo código (H13) |

### Testing

| ID | Regla | Hecho del repo que la respalda |
|---|---|---|
| R11 | Los tests construyen sus propios datos o fijan el conjunto. No dependen de que una combinación aleatoria exista | `test_b2b_endpoint_combines_new_filters` asume B2B + outcome + suppliers, y eso depende de la seed (H6) |
| R12 | Todo cambio en el manejo de fechas del frontend va con un test ejecutado con `TZ` distinta de UTC | El test de `computeMonthlyData` usa solo fechas a mitad de mes y no detectó H1; `2024-02-01` solo cambia de mes en `America/Santiago` y está en `sampleMovements`, que solo usa `computeKPIs` |

### Seguridad

| ID | Regla | Hecho del repo que la respalda |
|---|---|---|
| R13 | CORS no combina `allow_origins=["*"]` con `allow_credentials=True`. Los orígenes se leen de una variable de entorno | `backend/app/main.py` (H11) |

### DX y reproducibilidad

| ID | Regla | Hecho del repo que la respalda |
|---|---|---|
| R14 | Las dependencias nuevas se añaden con versión fija. En Docker, el frontend usa `npm ci` | `requirements.txt` sin versiones; `frontend/Dockerfile` usa `npm install` (H8) |

### Frontend y UX

| ID | Regla | Hecho del repo que la respalda |
|---|---|---|
| R15 | Los estilos se validan en el tema que realmente se usa (`dark`) y no se modifican las variables claras sin comprobarlo | `App.tsx:46` fija `className="dark"` y el modo claro de `index.css` no se usa (H9) |
| R16 | Cuando un `fetch` falla, se registra el error original antes de mostrar el mensaje | El `.catch(() => setError(...))` de `App.tsx` descarta la causa (H10) |

### Notas

- Son 16 reglas para 13 hallazgos. H5 genera R5 y R6, y H12 genera R8 y R9.
- R1, R2, R3, R4, R5, R6, R8, R9, R10, R11, R12, R13, R14 y R16 describen código que hoy no cumple la regla (deuda por corregir). R7 y R15 son precauciones que el código actual no incumple. El resto aplica además a código nuevo.
- Naming y Documentation no tienen reglas porque no tienen hallazgos.
- La Fase 3 convertirá estas reglas en archivos de `.agents/rules/`.
