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

## Skills de agentes (`feature/agent-skills`)

### Skill del ecosistema: `webapp-testing`
Busqué con `npx skills find` en `testing` y `seo`, y elegí `anthropics/skills@webapp-testing`.

**Por qué esta:** hasta ahora yo había revisado accesibilidad y rendimiento solo leyendo código. Con esta skill pude abrir el dashboard en un navegador real con Playwright y comprobar lo que pide el enunciado: foco con teclado, contraste, landmarks y errores de consola. Es la única de las que vi que guía ese trabajo y encaja con un frontend en Vite.

**Por qué no otras:** el resto de `testing` era de otros stacks o pedía herramientas extra, y `seo` no aporta a un dashboard interno sin páginas públicas.

**Cómo la usé:** antes de aplicarla leí su `SKILL.md` y su script, que solo ejecuta los comandos que le paso. Levanté el backend y el frontend en local y corrí un script headless con la API normal, lenta y caída.

**Qué encontré:** casi todo pasó: estructura de la página, nombre de los gráficos, foco visible, contraste mínimo de 5,18:1, movimiento reducido y mensaje de error. Lo que falló fue cosa mía: la tabla oculta de los gráficos añadía scroll en blanco bajo el dashboard, y lo corregí. Dejé sin corregir, por salirse del checklist, tres cosas: el `svg` de cada gráfico no tiene nombre accesible, el skeleton mide 8 px menos que la tarjeta real y el `body` tiene fondo claro. No lo probé con un lector de pantalla real.

## Historial
- Fase 1: verificación del resumen del proyecto (`../verification.md`).
- Fase 2: hallazgos y reglas propuestas (`../findings.md`).
- Fase 3: reglas del repositorio (`../.agents/rules/`).
- Fase 4: esta memoria (`memory-bank/`).
