# Stack tecnológico

Versiones tomadas de `frontend/package-lock.json`, `backend/requirements.txt`, los Dockerfiles y `docker-compose.yml`.

## Lenguajes
| Lenguaje | Versión | Fuente |
|---|---|---|
| Python | 3.13 (imagen Docker) | `backend/Dockerfile` |
| TypeScript | 6.0.2 | `frontend/package-lock.json` |

## Backend (`backend/`)
| Dependencia | Uso | Versión |
|---|---|---|
| fastapi | API REST | sin fijar |
| uvicorn[standard] | servidor ASGI | sin fijar |
| debugpy | depuración remota (puerto 5678) | sin fijar |
| pytest, pytest-cov | tests y cobertura | sin fijar |
| httpx | cliente para `TestClient` | sin fijar |

`backend/requirements.txt` no fija ninguna versión (hallazgo H8 en `../findings.md`).

## Frontend (`frontend/`)
| Dependencia | Uso | Versión (lockfile) |
|---|---|---|
| react, react-dom | UI | 19.2.5 |
| vite | bundler y servidor de desarrollo | 8.0.8 |
| tailwindcss | estilos | 4.2.2 |
| recharts | gráficos | 3.8.1 |
| lucide-react | iconos | 1.8.0 |
| vitest | tests | 4.1.4 |
| eslint | lint (con typescript-eslint) | 9.39.4 |

Componentes de UI estilo shadcn "new-york", color base zinc (`frontend/components.json`).

## Infraestructura y herramientas
- Docker Compose con 2 servicios, `frontend` y `backend` (`docker-compose.yml`).
- Frontend: imagen `node:24-alpine`, puerto 5173. El Dockerfile usa `npm install` (no `npm ci`).
- Backend: imagen `python:3.13-slim`, puertos 8000 (API) y 5678 (debugpy), con recarga automática.
- Proxy de Vite: `/api` apunta a `http://backend:8000`, que solo resuelve dentro de Docker (`frontend/vite.config.ts`). Se puede cambiar con `VITE_API_BASE_URL` (`frontend/.env.example`).
- Documentación de la API: `http://localhost:8000/docs` (Swagger de FastAPI).

## Comandos
- Todo: `docker compose up --build` (`README.es.md`).
- Backend: `cd backend && pytest`.
- Frontend: `cd frontend && npm test`, `npm run lint`, `npm run build` (`frontend/package.json`).

## Lo que no existe
Base de datos, CI (`.github/`), `.devcontainer/`, y archivos de formateo o linting de Python (`pyproject.toml`, ruff). Comprobado en la raíz del repo.
