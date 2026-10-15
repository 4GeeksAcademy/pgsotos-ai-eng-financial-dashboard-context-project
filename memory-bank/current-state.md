# Estado actual

Última actualización: 2026-10-15.

## Qué funciona (comprobado)
- Los 15 tests del backend pasan (`pytest`, en un venv temporal con Python 3.14; Docker usa 3.13). Ver `../verification.md`.
- Los 10 endpoints existen y devuelven datos deterministas con seed 42.
- El código define el flujo navegador → proxy de Vite → backend (`App.tsx`, `vite.config.ts`).

## Qué no está comprobado
- `npm test`, `npm run lint` y `npm run build` del frontend: nunca se ejecutaron (el frontend no tiene `node_modules`). Existen 5 tests en `frontend/src/lib/financial-utils.test.ts`.
- `docker compose up --build` de punta a punta.
- Que un agente pueda seguir cada regla de `.agents/rules/` sin ayuda.

## Gaps conocidos
Detalle, ubicación y evidencia en [`../findings.md`](../findings.md):

| ID | Resumen |
|---|---|
| H1 | Bug de zona horaria: el día 1 del mes cae en el mes anterior (`financial-utils.ts`) |
| H2 | Etiqueta "2024 - Full Year" frente a datos de 2025-10 a 2026-09 (`App.tsx`) |
| H3 | El mes en curso siempre cae un año atrás (`routes.py`, líneas 65 y 97) |
| H4 | `IndexError` en `build_metrics_facets` con lista vacía |
| H5 | `random.seed(42)` global y 8 endpoints que regeneran los datos |
| H6 | Test que depende de una combinación de datos con seed |
| H7 | Contrato `FinancialMovement` duplicado en Python y TypeScript |
| H8 | Dependencias sin fijar y `npm install` en Docker |
| H9 | Tema oscuro fijo; el modo claro nunca se usa |
| H10 | El `.catch` de `App.tsx` descarta el error original |
| H11 | CORS con `*` y credenciales (refleja cualquier origen) |
| H12 | `mock-data.ts` sin uso; el frontend usa 1 de 10 endpoints |
| H13 | `/b2b` y `/b2c` duplicados |

Las reglas derivadas están en `.agents/rules/`. 14 de las 16 reglas (todas menos R7 y R15) describen código que hoy no las cumple.

## Siguientes prioridades
**Decisión del usuario pendiente. No hay hoja de ruta en el repo ni un orden acordado.** Solo constan estos pendientes documentados:
- Ajustar y validar las reglas hasta que apliquen al flujo real del proyecto (`README.es.md`, paso 5, línea 26).
- Corregir el código que incumple las reglas (deuda marcada en `.agents/rules/`).
- Ejecutar la verificación pendiente del frontend y de Docker.

El orden y el alcance de estos puntos los define el usuario.

## Historial
- Fase 1: verificación del resumen del proyecto (`../verification.md`).
- Fase 2: hallazgos y reglas propuestas (`../findings.md`).
- Fase 3: reglas del repositorio (`../.agents/rules/`).
- Fase 4: esta memoria (`memory-bank/`).
