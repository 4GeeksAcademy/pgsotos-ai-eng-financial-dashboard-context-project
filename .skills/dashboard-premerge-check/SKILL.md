---
name: dashboard-premerge-check
description: Verifica que una rama de este dashboard financiero (FastAPI + React/Vite) está lista para PR contra main. Úsala antes de abrir un PR o cerrar una rama que toque frontend/, backend/ o memory-bank/. Solo informa; no edita archivos, no hace commit ni push.
---

# dashboard-premerge-check

## Objetivo
Decidir con evidencia si una rama de este repo puede ir a PR: que no empeora la línea base de verificación y que sus commits siguen las convenciones del proyecto.

## Entradas
- Rama actual (distinta de `main`) y `git diff main..HEAD --name-only`.
- `findings.md` (deuda H1–H13) y `.agents/rules/` (R1–R16).

## Línea base
Medida el 2026-11-17 en `feature/agent-skills`. Si una rama la cambia a propósito, actualiza esta tabla en la misma rama.

| Carpeta | Comando (desde la carpeta) | Esperado |
|---|---|---|
| `frontend/` | `npm run lint` | exit 0 |
| `frontend/` | `npx tsc -b` | exit 0 |
| `frontend/` | `npm test` | 5 tests pasan (`src/lib/financial-utils.test.ts`) |
| `frontend/` | `npm run build` | exit 0 y **sin advertencias** |
| `backend/` | `PYTHONPATH=. <venv>/bin/python -m pytest` | 15 tests pasan |

- Venv del backend, fuera del repo: `python3 -m venv <ruta>/venv && <ruta>/venv/bin/pip install -r backend/requirements.txt`. Docker usa Python 3.13 y Node 24: si se prueba con otra versión, anótalo en el informe.
- Si falta `frontend/node_modules`, corre `npm ci` (no `npm install`).
- Captura el exit code de cada comando sin pasarlo por un pipe (`| tail` lo oculta).

## Pasos
1. Confirma que la rama no es `main`. Los archivos sin seguimiento o modificados se reportan; solo bloquean si están en el diff.
2. Ejecuta los comandos solo de las carpetas tocadas. Cambios únicamente en `.claude/skills/`, `.skills/`, `skills-lock.json` o `memory-bank/` no disparan comandos.
3. Compara cada resultado con la línea base. Una diferencia (test nuevo, advertencia nueva) se explica o cuenta como fallo.
4. Revisa el diff contra estas reglas, con `archivo:línea` como evidencia:
   - **R7:** un cambio de contrato (campo o valor) toca backend y frontend, con tests de ambos lados, en el mismo commit.
   - **R12:** si cambia cómo se leen, formatean o agrupan fechas en el frontend, hay un test con día 1 de mes y se corre también `TZ=America/Santiago npm test`. Mover un formateador a una constante no cuenta.
   - **R14:** una dependencia de `package.json` o `requirements.txt` entra con versión fija en el mismo commit. `skills-lock.json` y `.claude/skills/` no cuentan.
   - **R15:** el elemento más externo que devuelve `App` conserva la clase `dark`; no se introduce modo claro. Compruébalo por el nombre de la clase, no por la línea.
   - **H1–H13:** busca cada archivo del diff en `findings.md`. Si el cambio toca una H, el commit, el PR o `memory-bank/current-state.md` lo declara; si no, no se corrige deuda de paso.
   - **`sr-only`:** el texto solo para lectores de pantalla va en un `<div className="sr-only">`, nunca en un `<table>`: una tabla ignora `height` y `overflow` y añade scroll (regresión corregida en `2bebfd8`).
5. Revisa los mensajes con `git log main..HEAD --format=%B`:
   - Conventional commit en español (`feat`, `fix`, `perf`, `docs`, `chore`, `test`, `refactor`) con **Propósito**, **Objetivos** y **Resumen**. En este repo la regla del español pesa más que la global.
   - Un cambio lógico por commit; un commit por skill aplicada, citada por nombre en el asunto o en el Propósito.
   - Sin `Co-Authored-By` ni atribución de IA.
6. Si cambió la línea base o el flujo de trabajo, `memory-bank/current-state.md` se actualiza en la misma rama.
7. Nunca se hace push a `main`: va rama + PR, y el push se confirma con el usuario.

## Salida esperada
1. Tabla `comando | exit code | resultado | vs línea base`.
2. Estado de cada regla (R7, R12, R14, R15, H1–H13, `sr-only`, commits, memory bank): `cumple`, `incumple` o `no aplica`, con evidencia.
3. Veredicto:
   - `LISTO`: todo cumple.
   - `LISTO CON OBSERVACIONES`: los comandos pasan y lo único que incumple es documental (por ejemplo, una H no declarada), con la forma de arreglarlo.
   - `NO LISTO`: falla un comando o una regla de código.

## Criterios de aceptación
- Cada comando aplicable tiene su exit code real, no inferido.
- Toda diferencia con la línea base está explicada.
- Cada regla tiene un estado con evidencia, o `no aplica` con el motivo.
- El veredicto es coherente con los estados.
- La skill no modifica archivos del repo, no hace commit ni push. No cuentan los artefactos ignorados por git (`frontend/dist/`, `__pycache__`), el borrado de un `*.tsbuildinfo` fuera de `node_modules` ni `npm ci`.
