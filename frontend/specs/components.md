# Especificación de componentes (Fase 3)

Especificación del frontend para las tres funcionalidades del PM. Es solo especificación: no se implementa ningún componente ni llamada a la API. Los tipos salen de `api-types.ts` y `param-types.ts` (Fase 2). Los desajustes `D1` a `D11` están en `api-exploration.md`.

## Convenciones

- **Pila existente:** React 19, Tailwind 4, Recharts 3 y los componentes `Card` y `Skeleton` de `src/components/ui/`. No hay librería de rutas y no se agrega ninguna dependencia.
- **Tema:** solo oscuro (R15). Colores con variables semánticas (`--chart-income`, `--chart-outcome`), nunca colores directos.
- **Formato numérico único (en-US):** dinero con `formatCurrency` de `src/lib/financial-utils.ts` (en-US, 0 decimales, por ejemplo `$18,254`); porcentajes con punto decimal y 1 decimal (`+149.7 %`, `62.5 %`); razones con punto (`1.8303`). Como `formatCurrency` redondea a 0 decimales, las filas mostradas pueden no sumar exactamente el total del pie.
- **Mensaje de error genérico:** "No se pudieron cargar los datos. Intenta de nuevo." Se usa cuando falla una petición (error de red, `!response.ok` o 422) y no hay un mensaje más específico.
- **Fetch:** mismo patrón que `App.tsx`: `API_BASE_URL` desde `VITE_API_BASE_URL`, lanzar error si `!response.ok`, y registrar el error original con `console.error` antes de mostrar el mensaje (R16).
- **Parámetros vacíos:** una fecha vacía no se envía en la query (no se manda `start_date=`).
- **Texto de interfaz:** español. Las etiquetas de categoría se traducen así: `suppliers` Proveedores, `sales` Ventas, `operational` Operación, `administrative` Administración, `others` Otros.
- **Accesibilidad:** cada input con `<label>`; mensajes de validación y estados vacíos en una región `aria-live="polite"`; tablas con `<caption>` y `scope` en los encabezados.
- **Carga y respuestas obsoletas:** mientras llega una respuesta, los paneles de datos muestran `Skeleton`. Cada panel (y cada línea de negocio en la vista comparativa) tiene su propio token de petición: al lanzar una nueva petición se incrementa el token y se aborta la anterior con `AbortController`. Una respuesta cuyo token ya no es el último se descarta. Al desmontar el componente se aborta la petición en curso y se ignora su resultado.

## Estado compartido (propiedad de `App`)

| Estado | Tipo | Valor inicial | Uso |
|---|---|---|---|
| `dateRange` | `DateRangeFilter` | `{}` | Lo leen las tres funcionalidades. Un solo filtro para ambas vistas. |
| `threshold` | `number` | `0.3` | Funcionalidad 2. |
| `view` | `DashboardView` | `"overview"` | Funcionalidad 3. |
| `facets` | `FacetsResponse` o `null` | `null` | Se pide una vez al montar (`GET /api/metrics/facets`). Queda en `null` mientras carga y si falla. |
| `facetsStatus` | `"loading" \| "ready" \| "error"` | `"loading"` | Estado de la petición de facetas. Pasa a `"ready"` o `"error"` una sola vez. |

`DashboardView` se define así: `"overview" | "comparison"`.

Los límites de fecha (`bounds`) se derivan de `facets`: solo existen con `facetsStatus === "ready"`; en `"loading"` y en `"error"` son `null`.

## Componente nuevo común: `EmptyState`

Se usa en todos los estados vacíos, para que ninguno desaparezca en silencio.

| Prop | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `title` | `string` | Sí | Mensaje principal. |
| `description` | `string` | No | Detalle o sugerencia (por ejemplo, ampliar el rango). |

Renderizado: icono neutro, `title` y `description` opcional, dentro de `aria-live="polite"`.

## Funcionalidad 1: filtro de rango de fechas

### `DateRangeFilterBar` (nuevo)

Dos inputs `type="date"` en la parte superior del dashboard, con el rango disponible como referencia. Mantiene **valores locales (borrador)** para ambos inputs: el usuario puede escribir una fecha sin que se aplique. `onChange` se llama solo cuando el borrador forma un rango válido. Cuando `value` cambia desde fuera, el borrador se sincroniza con él.

| Prop | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `value` | `DateRangeFilter` | Sí | Rango aplicado actualmente. |
| `bounds` | `Pick<FacetsResponse, "min_date" \| "max_date">` o `null` | Sí | Límites disponibles. `null` mientras cargan las facetas y si fallan. |
| `facetsStatus` | `"loading" \| "ready" \| "error"` | Sí | Distingue "cargando" de "error" cuando `bounds` es `null`. |
| `onChange` | `(next: DateRangeFilter) => void` | Sí | Se llama solo con un rango válido. |
| `disabled` | `boolean` | No | Desactiva los inputs (por defecto `false`). |

Renderizado condicional:

| Situación | Qué se muestra |
|---|---|
| `facetsStatus === "loading"` | Inputs desactivados y `Skeleton` en lugar del texto de referencia. |
| `facetsStatus === "error"` (`bounds === null`) | Inputs activos sin atributos `min` y `max`, y el texto "Rango disponible no cargado". El filtro sigue funcionando; las fechas fuera de límites no se pueden validar. |
| `facetsStatus === "ready"` | Texto "Datos disponibles: {min_date} a {max_date}" y atributos `min` y `max` en ambos inputs. |
| Ambos inputs vacíos | Se muestran todos los datos. Sin botón de limpiar. |
| Solo `start_date` | Rango abierto: desde esa fecha hasta `max_date`. Sin error. |
| Solo `end_date` | Rango abierto: desde `min_date` hasta esa fecha. Sin error. |
| `start_date` posterior a `end_date` | Error en línea "La fecha de inicio no puede ser posterior a la de fin". **No** se llama a `onChange`; sigue aplicado el último rango válido (D11). |
| Fecha fuera de `bounds` (solo con `facetsStatus === "ready"`) | Error en línea "Fecha fuera del rango disponible". No se aplica. |
| Hay al menos una fecha (en el borrador o aplicada) | Botón "Limpiar". |

Reglas del error en línea y de "Limpiar":

- El error en línea se borra en cuanto el borrador vuelve a ser un rango válido (y en ese momento se llama a `onChange`) o al pulsar "Limpiar".
- "Limpiar" vacía el borrador de ambos inputs y el rango aplicado: llama a `onChange({})`.

Datos: `GET /api/metrics` con `start_date` y `end_date` (parámetros del tipo `DateRangeFilter`).

### Componentes existentes que cambian

| Componente | Cambio de props |
|---|---|
| `DashboardHeader` | `period` pasa a derivarse del rango activo. Recibe `dateRange`, `bounds` y `facetsStatus`. Sin filtro: `{min_date} a {max_date}` con `facetsStatus === "ready"`. Con filtro: las fechas aplicadas (un lado abierto se completa con el límite de `bounds`). Con `facetsStatus === "loading"`: `Skeleton`. Con `facetsStatus === "error"`: "Todos los datos" si no hay filtro; con filtro, las fechas aplicadas y el lado abierto como "sin límite". Se elimina el texto fijo `2024 - Full Year` (R2, D10). |
| `KPIRow` | Sin cambio de props. Con 0 movimientos muestra "—" en cada KPI. |
| `IncomeOutcomeChart`, `ProfitPercentChart` | Sin cambio de props. Con 0 movimientos se reemplazan por `EmptyState` con `title` "Sin movimientos en este rango". |

## Funcionalidad 2: tabla de alertas de anomalías

Va bajo los gráficos existentes de la vista `overview`.

### `AlertThresholdInput` (nuevo)

Mantiene un **borrador de texto local**. `value` es el umbral aplicado; el borrador puede ser distinto mientras se escribe.

| Prop | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `value` | `number` | Sí | Umbral aplicado. |
| `onChange` | `(next: number) => void` | Sí | Se llama con un valor válido, con debounce de 300 ms. |

Input `type="number"`, `min="0.01"`, `max="1"`, `step="0.01"`, valor inicial `0.3`. Con la etiqueta "Umbral de alerta (razón entre 0.01 y 1.0)". Junto al input, un texto indica el umbral aplicado: "Umbral aplicado: {Math.round(value * 100)} %" (por ejemplo, `0.3` muestra "30 %").

| Situación | Qué se muestra |
|---|---|
| Borrador entre 0.01 y 1.0 | Se aplica tras el debounce de 300 ms. El error en línea, si había, se borra. |
| Borrador vacío, no numérico, menor que 0.01 o mayor que 1.0 | Error en línea "Ingresa un valor entre 0.01 y 1.0". No se llama a `onChange`; sigue el último valor válido (D1). El error permanece hasta que el borrador sea válido o termine el `blur`. |
| `blur` con borrador inválido | El texto del input vuelve al valor aplicado (`value`) y el error se borra. |
| `blur` con borrador válido | Se cancela el debounce pendiente y se aplica el valor al instante. |
| Desmontaje | Se cancela el debounce pendiente; no se llama a `onChange`. |

### `AnomalyAlertsTable` (nuevo)

| Prop | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `entries` | `AlertEntry[]` | Sí | Respuesta de `GET /api/metrics/alerts` (`AlertsResponse`). |
| `threshold` | `number` | Sí | Umbral usado, para el mensaje de estado vacío. |
| `dateRange` | `DateRangeFilter` | Sí | Rango activo, para el texto del estado vacío y el aviso de meses incompletos. |
| `loading` | `boolean` | No | `true` mientras llega la respuesta. |
| `error` | `string \| null` | No | Mensaje si la petición falló. |

Columnas (en este orden):

| Encabezado | Campo | Formato |
|---|---|---|
| Período | `period` | Tal cual (`YYYY-MM`, porque `group_by` se fija a `month`, D4). |
| Gasto registrado | `outcome_total` | `formatCurrency` (por ejemplo `$18,254`). |
| Promedio histórico del rango | `baseline_average` | `formatCurrency`. El encabezado no dice "media móvil" (D2). |
| Incremento | `increase_ratio` | `increase_ratio * 100` con 1 decimal y signo `+`, por ejemplo `+149.7 %` (D3). |

Renderizado condicional:

| Situación | Qué se muestra |
|---|---|
| `loading` | 3 filas de `Skeleton`. |
| `error` distinto de `null` | Mensaje de error dentro de la tarjeta; la tabla no se dibuja y no se muestran las notas ni el aviso. |
| `entries.length === 0` | `EmptyState` con `title` "No se detectaron anomalías" y `description` "Con un umbral de {Math.round(threshold * 100)} % en {el rango seleccionado \| todos los datos}". La tabla **no** desaparece sin mensaje. |
| `entries.length > 0` | Tabla con las filas en el orden de la respuesta (cronológico). |
| Meses incompletos (sin `loading` ni `error`, con o sin filas) | Aviso fijo bajo la tabla: "El rango incluye meses incompletos: el primer y el último mes suman solo parte del mes y pueden distorsionar las alertas". Se muestra si `start_date` existe y no es día 1, o si `end_date` existe y no es el último día de su mes. Un lado abierto cuenta como completo. |

Nota fija bajo la tabla (sin `loading` ni `error`): "El primer período del rango no genera alertas porque no tiene historial" (D5).

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

Contenedor de la vista. Recibe las facetas ya cargadas por `App` y lanza dos peticiones en paralelo, una por línea de negocio (token y `AbortController` independientes por línea; ver Convenciones).

| Prop | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `facets` | `FacetsResponse \| null` | Sí | Define las secciones: una por cada valor de `facets.business_types`. |
| `facetsStatus` | `"loading" \| "ready" \| "error"` | Sí | Con `"error"`, las secciones salen de la lista fija `["B2B", "B2C"]`. |
| `dateRange` | `DateRangeFilter` | Sí | Rango activo. |

Datos: dos llamadas a `GET /api/metrics/categories/top` con `TopCategoriesParams`: `operation_type: "income"` (D7), `limit: 20` (máximo de la API, para obtener todas las categorías y calcular el total real) y `business_type` `B2B` o `B2C`, más el rango de `dateRange`. Cada tabla muestra todas las filas recibidas, que ya vienen ordenadas de mayor a menor.

| Situación | Qué se muestra |
|---|---|
| `facetsStatus === "loading"` | Dos secciones con `Skeleton`. Las peticiones no se lanzan hasta salir de este estado. |
| `facetsStatus === "error"` | Las secciones salen de `["B2B", "B2C"]` y las peticiones se lanzan igual. La vista no depende de las facetas para funcionar. |
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
| % del grupo | `total_amount` | `total_amount / suma de total_amount de todas las filas`, 1 decimal (D8), por ejemplo `62.5 %`. |

Pie con el total del grupo: la suma de `total_amount` de todas las filas recibidas, que son todas las mostradas. Como cada celda se redondea a 0 decimales, las filas pueden no sumar exactamente el total del pie.

| Situación | Qué se muestra |
|---|---|
| `loading` | 2 filas de `Skeleton`. |
| `error` | Mensaje de error; sin tabla. |
| `entries.length === 0` | `EmptyState` con `title` "Sin ingresos de {B2B \| B2C} en este rango"; total del grupo `$0` y sin columna de porcentaje (evita dividir entre 0). |
| `entries.length >= 1` | Todas las filas recibidas, sin rellenar. Con ingresos solo hay `sales` y `others`, es decir, como máximo 2 filas (D6). Nota: "Solo se listan categorías con ingresos". |

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
| D5 primer período | Nota fija bajo `AnomalyAlertsTable`. Con rangos que cortan meses, además el aviso de meses incompletos. |
| D6 5 categorías | `CategoryTotalsTable` muestra todas las filas existentes (máximo 2 con ingresos). |
| D7 tipo de operación | `BusinessComparisonPage` envía `operation_type: "income"`. |
| D8 porcentaje | Calculado en `CategoryTotalsTable` con la suma de todas las filas. |
| D9 total del gráfico | Suma de `total_amount` por línea en `BusinessComparisonPage`. |
| D10 facetas | Solo se usan para los límites de fecha y para listar las líneas de negocio; si fallan, se usa `["B2B", "B2C"]` y sin límites. Las categorías salen de la respuesta de `categories/top`. |
| D11 orden de fechas | `DateRangeFilterBar` bloquea el rango inválido. |
