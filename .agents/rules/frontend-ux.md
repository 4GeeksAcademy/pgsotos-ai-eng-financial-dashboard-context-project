# Frontend y manejo de errores

## Alcance
- `frontend/src/App.tsx`.
- `frontend/src/components/dashboard/` y `frontend/src/index.css`.

## Justificación
El tema claro nunca se usa y los errores de red pierden su causa (`findings.md`, H9 y H10).

## Guía específica del proyecto

### R15. Validar los estilos en el tema que realmente se usa
- **Hecho:** `App.tsx:46` fija `className="dark"` en `<main>`. `index.css` define también variables para el modo claro (`:root`), que nunca se aplican (H9).
- Al cambiar colores o estilos, comprobarlos en tema oscuro.
- No editar variables del `:root` esperando ver el cambio sin comprobarlo.
- Usar las variables semánticas existentes (`--chart-income`, `--chart-outcome`, `--income-badge`…), no colores directos.

### R16. Registrar el error original antes de mostrar el mensaje
- **Hecho:** el `.catch(() => setError("No se pudo cargar…"))` de `App.tsx` descarta la causa (H10). `fetchFinancialData` sí lanza un error con el código de estado, pero no se registra.
- **Mal:** `.catch(() => setError(...))`
- **Bien:** `.catch((err) => { console.error(err); setError(...) })`
- **Estado:** deuda por corregir.
