# Especificación de componentes (Fase 3)

Especificación del frontend para las tres funcionalidades del PM. Es solo especificación: no se implementa ningún componente ni llamada a la API. Los tipos salen de `api-types.ts` y `param-types.ts` (Fase 2). Los desajustes `D1` a `D11` están en `api-exploration.md`.

## Convenciones

- **Pila existente:** React 19, Tailwind 4, Recharts 3 y los componentes `Card` y `Skeleton` de `src/components/ui/`. No hay librería de rutas y no se agrega ninguna dependencia.
- **Tema:** solo oscuro (R15). Colores con variables semánticas (`--chart-income`, `--chart-outcome`), nunca colores directos.
- **Formato de dinero:** reutilizar `formatCurrency` de `src/lib/financial-utils.ts`.
- **Fetch:** mismo patrón que `App.tsx`: `API_BASE_URL` desde `VITE_API_BASE_URL`, lanzar error si `!response.ok`, y registrar el error original con `console.error` antes de mostrar el mensaje (R16).
- **Parámetros vacíos:** una fecha vacía no se envía en la query (no se manda `start_date=`).
- **Texto de interfaz:** español. Las etiquetas de categoría se traducen así: `suppliers` Proveedores, `sales` Ventas, `operational` Operación, `administrative` Administración, `others` Otros.
- **Accesibilidad:** cada input con `<label>`; mensajes de validación y estados vacíos en una región `aria-live="polite"`; tablas con `<caption>` y `scope` en los encabezados.
- **Carga:** mientras llega una respuesta, los paneles de datos muestran `Skeleton`. Si llegan dos respuestas en desorden, gana la última petición enviada (se descarta la anterior).

## Estado compartido (propiedad de `App`)

| Estado | Tipo | Valor inicial | Uso |
|---|---|---|---|
| `dateRange` | `DateRangeFilter` | `{}` | Lo leen las tres funcionalidades. Un solo filtro para ambas vistas. |
| `threshold` | `number` | `0.3` | Funcionalidad 2. |
| `view` | `DashboardView` | `"overview"` | Funcionalidad 3. |
| `facets` | `FacetsResponse` o `null` | `null` | Se pide una vez al montar (`GET /api/metrics/facets`). |

`DashboardView` se define así: `"overview" | "comparison"`.

## Componente nuevo común: `EmptyState`

Se usa en todos los estados vacíos, para que ninguno desaparezca en silencio.

| Prop | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `title` | `string` | Sí | Mensaje principal. |
| `description` | `string` | No | Detalle o sugerencia (por ejemplo, ampliar el rango). |

Renderizado: icono neutro, `title` y `description` opcional, dentro de `aria-live="polite"`.

## Funcionalidad 1: filtro de rango de fechas

### `DateRangeFilterBar` (nuevo)

Dos inputs `type="date"` en la parte superior del dashboard, con el rango disponible como referencia.

| Prop | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `value` | `DateRangeFilter` | Sí | Rango aplicado actualmente. |
| `bounds` | `Pick<FacetsResponse, "min_date" \| "max_date">` o `null` | Sí | Límites disponibles. `null` mientras cargan las facetas. |
| `onChange` | `(next: DateRangeFilter) => void` | Sí | Se llama solo con un rango válido. |
| `disabled` | `boolean` | No | Desactiva los inputs (por defecto `false`). |

Renderizado condicional:

| Situación | Qué se muestra |
|---|---|
| `bounds === null` (cargando) | Inputs desactivados y `Skeleton` en lugar del texto de referencia. |
| Facetas con error | Inputs sin atributos `min` y `max`, y el texto "Rango disponible no cargado". El filtro sigue funcionando. |
| `bounds` disponible | Texto "Datos disponibles: {min_date} a {max_date}" y atributos `min` y `max` en ambos inputs. |
| Ambos inputs vacíos | Se muestran todos los datos. Sin botón de limpiar. |
| Solo `start_date` | Rango abierto: desde esa fecha hasta `max_date`. Sin error. |
| Solo `end_date` | Rango abierto: desde `min_date` hasta esa fecha. Sin error. |
| `start_date` posterior a `end_date` | Error en línea "La fecha de inicio no puede ser posterior a la de fin". **No** se llama a `onChange`; sigue aplicado el último rango válido (D11). |
| Fecha fuera de `bounds` | Error en línea "Fecha fuera del rango disponible". No se aplica. |
| Hay al menos una fecha | Botón "Limpiar" que deja `{}`. |

### Componentes existentes que cambian

| Componente | Cambio de props |
|---|---|
| `DashboardHeader` | `period` pasa a derivarse del rango activo: sin filtro, `{min_date} a {max_date}`; con filtro, las fechas aplicadas (un lado abierto se completa con el límite de `bounds`). Se elimina el texto fijo `2024 - Full Year` (R2, D10). |
| `KPIRow` | Sin cambio de props. Con 0 movimientos muestra "—" en cada KPI. |
| `IncomeOutcomeChart`, `ProfitPercentChart` | Sin cambio de props. Con 0 movimientos se reemplazan por `EmptyState` con `title` "Sin movimientos en este rango". |

Datos: `GET /api/metrics` con `start_date` y `end_date` (parámetros del tipo `DateRangeFilter`).

## Funcionalidad 2: tabla de alertas de anomalías

Va bajo los gráficos existentes de la vista `overview`.

### `AlertThresholdInput` (nuevo)

| Prop | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `value` | `number` | Sí | Umbral aplicado. |
| `onChange` | `(next: number) => void` | Sí | Se llama con un valor válido, con debounce de 300 ms. |

Input `type="number"`, `min="0.01"`, `max="1"`, `step="0.01"`, valor inicial `0.3`. Con la etiqueta "Umbral de alerta (razón entre 0.01 y 1.0)".

| Situación | Qué se muestra |
|---|---|
| Valor entre 0.01 y 1.0 | Se aplica tras el debounce. |
| Vacío, no numérico, menor que 0.01 o mayor que 1.0 | Error en línea "Ingresa un valor entre 0.01 y 1.0". No se llama a `onChange`; sigue el último valor válido (D1). |

### `AnomalyAlertsTable` (nuevo)

| Prop | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `entries` | `AlertEntry[]` | Sí | Respuesta de `GET /api/metrics/alerts` (`AlertsResponse`). |
| `threshold` | `number` | Sí | Umbral usado, para el mensaje de estado vacío. |
| `dateRange` | `DateRangeFilter` | Sí | Rango activo, para el texto del estado vacío. |
| `loading` | `boolean` | No | `true` mientras llega la respuesta. |
| `error` | `string \| null` | No | Mensaje si la petición falló. |

Columnas (en este orden):

| Encabezado | Campo | Formato |
|---|---|---|
| Período | `period` | Tal cual (`YYYY-MM`, porque `group_by` se fija a `month`, D4). |
| Gasto registrado | `outcome_total` | `formatCurrency`. |
| Promedio histórico del rango | `baseline_average` | `formatCurrency`. El encabezado no dice "media móvil" (D2). |
| Incremento | `increase_ratio` | `increase_ratio * 100` con 1 decimal y signo `+`, por ejemplo `+149,7 %` (D3). |

Renderizado condicional:

| Situación | Qué se muestra |
|---|---|
| `loading` | 3 filas de `Skeleton`. |
| `error` distinto de `null` | Mensaje de error dentro de la tarjeta; la tabla no se dibuja. |
| `entries.length === 0` | `EmptyState` con `title` "No se detectaron anomalías" y `description` "Con un umbral de {threshold × 100} % en {el rango seleccionado \| todos los datos}". La tabla **no** desaparece sin mensaje. |
| `entries.length > 0` | Tabla con las filas en el orden de la respuesta (cronológico). |

Nota fija bajo la tabla: "El primer período del rango no genera alertas porque no tiene historial" (D5).

Datos: `GET /api/metrics/alerts` con `AlertsParams`: `threshold`, `group_by: "month"` y el rango de `dateRange`. `business_type` se omite (ambas líneas).

## Funcionalidad 3: vista comparativa B2B vs B2C

### `DashboardViewNav` (nuevo)

Pestañas "Resumen" y "Comparativa B2B vs B2C". No hay router: `App` cambia de vista con el estado `view` (sin dependencias nuevas).

| Prop | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `view` | `DashboardView` | Sí | Vista activa. |
| `onChange` | `(next: DashboardView) => void` | Sí | Cambio de vista. |

`role="tablist"`, cada pestaña con `role="tab"` y `aria-selected`. El filtro de fechas (`DateRangeFilterBar`) se mantiene visible en ambas vistas y conserva su valor al cambiar.

### `BusinessComparisonPage` (nuevo)

Contenedor de la vista. Pide las facetas ya cargadas por `App` y lanza dos peticiones en paralelo, una por línea de negocio.

| Prop | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `facets` | `FacetsResponse \| null` | Sí | Define las secciones: una por cada valor de `facets.business_types`. |
| `dateRange` | `DateRangeFilter` | Sí | Rango activo. |

Datos: dos llamadas a `GET /api/metrics/categories/top` con `TopCategoriesParams`: `operation_type: "income"` (D7), `limit: 20` (máximo de la API, para obtener todas las categorías y calcular el total real) y `business_type` `B2B` o `B2C`, más el rango de `dateRange`. Cada tabla muestra como máximo las 5 primeras filas, que ya vienen ordenadas de mayor a menor.

| Situación | Qué se muestra |
|---|---|
| `facets === null` | Dos secciones con `Skeleton`. |
| Una de las dos peticiones falla | Esa sección muestra su error; el gráfico no se dibuja y muestra "No hay datos de ambas líneas para comparar". La otra sección sigue visible. |
| Ambas responden | Dos secciones en paralelo y, debajo, el gráfico. |

### `CategoryTotalsTable` (nuevo)

| Prop | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `businessType` | `BusinessType` | Sí | Línea de negocio de la sección. |
| `entries` | `CategoryEntry[]` | Sí | Respuesta de `categories/top` (`TopCategoriesResponse`), con todas las categorías. |
| `loading` | `boolean` | No | `true` mientras llega la respuesta. |
| `error` | `string \| null` | No | Mensaje si la petición falló. |

Columnas:

| Encabezado | Campo | Formato |
|---|---|---|
| Categoría | `category` | Etiqueta traducida (ver Convenciones). |
| Total de ingresos | `total_amount` | `formatCurrency`. |
| % del grupo | `total_amount` | `total_amount / suma de total_amount de todas las filas`, 1 decimal (D8). |

Pie con el total del grupo: la suma de `total_amount` de **todas** las filas recibidas, no solo las 5 mostradas.

| Situación | Qué se muestra |
|---|---|
| `loading` | 2 filas de `Skeleton`. |
| `error` | Mensaje de error; sin tabla. |
| `entries.length === 0` | `EmptyState` con `title` "Sin ingresos de {B2B \| B2C} en este rango"; total del grupo `$0` y sin columna de porcentaje (evita dividir entre 0). |
| `entries.length` entre 1 y 4 | Se muestran solo las filas existentes, sin rellenar hasta 5. Con ingresos solo hay `sales` y `others`, es decir, como máximo 2 filas (D6). Nota: "Solo se listan categorías con ingresos". |
| `entries.length` de 5 o más | Máximo 5 filas. |

### `BusinessRevenueChart` (nuevo)

Gráfico de barras Recharts con una barra por línea de negocio. Va una sola vez, debajo de ambas secciones.

| Prop | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `b2bTotal` | `number` | Sí | Suma de `total_amount` de todas las filas de B2B. |
| `b2cTotal` | `number` | Sí | Suma de `total_amount` de todas las filas de B2C. |
| `loading` | `boolean` | No | `true` mientras llega alguna de las dos respuestas. |

El total sale de sumar `total_amount`, porque ningún endpoint lo devuelve (D9).

| Situación | Qué se muestra |
|---|---|
| `loading` | `Skeleton` del tamaño del gráfico. |
| `b2bTotal === 0` y `b2cTotal === 0` | `EmptyState` con `title` "Sin ingresos para comparar en este rango". No se dibuja el gráfico. |
| Solo uno de los dos es 0 | El gráfico se dibuja con esa barra en 0 y la etiqueta "$0". |
| Ambos con valor | Dos barras con `formatCurrency` en el tooltip. |

## Resolución de los desajustes del PM

| Desajuste | Dónde se resuelve |
|---|---|
| D1 umbral 0.01–1.0 | `AlertThresholdInput` valida el rango; la API no lo exige. |
| D2 media móvil | Encabezado "Promedio histórico del rango" en `AnomalyAlertsTable`. |
| D3 porcentaje | `AnomalyAlertsTable` multiplica `increase_ratio` por 100. |
| D4 `group_by` | Fijo en `"month"`. |
| D5 primer período | Nota fija bajo `AnomalyAlertsTable`. |
| D6 5 categorías | `CategoryTotalsTable` muestra solo las filas existentes (máximo 2 con ingresos). |
| D7 tipo de operación | `BusinessComparisonPage` envía `operation_type: "income"`. |
| D8 porcentaje | Calculado en `CategoryTotalsTable` con la suma de todas las filas. |
| D9 total del gráfico | Suma de `total_amount` por línea en `BusinessComparisonPage`. |
| D10 facetas | Solo se usan para los límites de fecha y para listar las líneas de negocio. Las categorías salen de la respuesta de `categories/top`. |
| D11 orden de fechas | `DateRangeFilterBar` bloquea el rango inválido. |
