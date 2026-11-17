# Contrato de datos del frontend

Contrato entre el frontend y la API del backend para tres funcionalidades: filtro de rango de fechas, tabla de alertas de anomalías y vista comparativa B2B vs B2C. Está pensado para que una sesión nueva de un coding agent lo lea y construya sin hacer preguntas.

## Archivos de esta carpeta

| Archivo | Contenido |
|---|---|
| `api-exploration.md` | Evidencia de la API y los desajustes `D1` a `D11` entre el brief del PM y el backend. |
| `api-types.ts` | Tipos de respuesta: `FacetsResponse`, `AlertEntry`, `AlertsResponse`, `CategoryEntry`, `TopCategoriesResponse`. |
| `param-types.ts` | Tipos de parámetros: `DateRangeFilter`, `AlertsParams`, `TopCategoriesParams`, `GroupBy`. |
| `components.md` | Componentes, props y renderizado condicional. |
| `README.md` | Este contrato. |

## Reglas generales de la API

- **Base:** `VITE_API_BASE_URL` (vacío en desarrollo: el proxy de Vite reenvía `/api`). Documentación viva en `http://localhost:8000/docs`.
- **Fechas:** cadenas `YYYY-MM-DD`. Los límites son inclusivos (`>= start_date` y `<= end_date`).
- **Parámetros vacíos:** no se envían. `start_date=` vacío provoca un 422.
- **Error de validación (HTTP 422):** `{ "detail": [{ "type", "loc", "msg", "input" }] }`. Ejemplo: `threshold=-1` da `loc: ["query", "threshold"]` y `msg: "Input should be greater than or equal to 0"`.
- **Sin datos:** los endpoints de lista responden 200 con `[]`. Nunca 404.
- **Datos de ejemplo:** el backend genera los datos con `date.today()` (hallazgo H3), así que los rangos y los totales cambian con la fecha. Los números de ejemplo de este documento corresponden al 2026-11-16 y no deben copiarse a pruebas.
- **Lectura de errores:** si `!response.ok`, lanzar un error con el código de estado y registrar el original con `console.error` antes de mostrar el mensaje.

## Funcionalidad 1: filtro de rango de fechas

**Endpoints**

| Endpoint | Uso | Tipos |
|---|---|---|
| `GET /api/metrics/facets` | Límites `min_date` y `max_date` y texto de referencia. Una sola vez al montar. | respuesta `FacetsResponse` |
| `GET /api/metrics` | Movimientos del dashboard principal. | parámetros `DateRangeFilter` (más `category` y `operation_type`, que esta funcionalidad no usa) |

**Parámetros (`DateRangeFilter`)**

| Parámetro | Tipo | Valores válidos | Por defecto |
|---|---|---|---|
| `start_date` | `string` opcional | `YYYY-MM-DD` válido | sin límite inferior (`min_date`) |
| `end_date` | `string` opcional | `YYYY-MM-DD` válido | sin límite superior (`max_date`) |

**Casos límite**

1. **Solo una fecha.** El rango queda abierto: solo `start_date` va desde esa fecha hasta `max_date`; solo `end_date` va desde `min_date` hasta esa fecha. No es un error. La UI muestra el período con el lado abierto completado con el límite de `FacetsResponse`.
2. **Inicio posterior al fin.** La API responde 200 con `[]` y no avisa. La UI lo bloquea con el error "La fecha de inicio no puede ser posterior a la de fin" y mantiene el último rango válido.
3. **Rango dentro de los límites pero sin movimientos.** La API responde 200 con `[]`. La UI muestra `EmptyState` "Sin movimientos en este rango" y "—" en cada KPI.
4. **Fecha con formato inválido** (por ejemplo `2026-13-45`). La API responde 422. Los inputs `type="date"` lo previenen; si ocurre, se muestra el mensaje de error genérico.

## Funcionalidad 2: tabla de alertas de anomalías

**Endpoint:** `GET /api/metrics/alerts`.

**Tipos:** parámetros `AlertsParams`, respuesta `AlertsResponse` (lista de `AlertEntry`).

**Parámetros**

| Parámetro | Tipo | Valores válidos | Por defecto | Nota |
|---|---|---|---|---|
| `threshold` | `number` | API: cualquier valor `>= 0`. UI: de `0.01` a `1.0`. | `0.3` | Es una razón: `0.3` significa +30 %. |
| `group_by` | `GroupBy` | `day`, `week`, `month` | `month` | La UI fija `month`. |
| `start_date`, `end_date` | `string` opcional | `YYYY-MM-DD` | sin límite | Mismo rango que la funcionalidad 1. |
| `business_type` | `BusinessType` opcional | `B2B`, `B2C` | ambos | La UI no lo envía. |

**Respuesta (`AlertEntry`)**

| Campo | Tipo | Significado |
|---|---|---|
| `period` | `string` | `YYYY-MM` con `group_by=month`. |
| `outcome_total` | `number` | Gasto del período. |
| `baseline_average` | `number` | Promedio del gasto de **todos** los períodos anteriores dentro del rango (no una media móvil de 3). |
| `increase_ratio` | `number` | `(outcome_total - baseline_average) / baseline_average`, 4 decimales. La UI lo muestra como porcentaje (por 100). |

Un período solo genera alerta si hay historial anterior, `baseline_average > 0` y `increase_ratio` es **mayor** que `threshold`.

**Casos límite**

1. **Sin anomalías.** La API responde 200 con `[]` (por ejemplo `threshold=5`). La UI muestra `EmptyState` "No se detectaron anomalías" con el umbral y el rango; la tabla no desaparece sin mensaje.
2. **Umbral fuera de rango.** Con `threshold=-1` la API responde 422; con `threshold=5` acepta el valor. La UI solo deja aplicar de `0.01` a `1.0` y conserva el último valor válido.
3. **El primer período nunca alerta.** No tiene historial. Con un rango corto hay pocas o ninguna alerta. La UI lo indica con una nota fija bajo la tabla.
4. **Meses incompletos.** Si el rango no empieza el día 1 ni termina el último día del mes, el primer y el último mes suman solo parte del mes. Ejemplo (datos del 2026-11-16, `start_date=2026-03-15`, `end_date=2026-06-10`, `threshold=0.01`): marzo suma 18 254,17 frente a 51 665,68 de abril, y abril sale como alerta con `increase_ratio` 1,8303 por un promedio inflado a la baja. La UI debe avisar cuando el rango incluye meses incompletos.

## Funcionalidad 3: comparativa B2B vs B2C

**Endpoints**

| Endpoint | Uso | Tipos |
|---|---|---|
| `GET /api/metrics/categories/top` | Ranking de categorías por línea de negocio. Dos llamadas en paralelo, una con `business_type=B2B` y otra con `B2C`. | parámetros `TopCategoriesParams`, respuesta `TopCategoriesResponse` (lista de `CategoryEntry`) |
| `GET /api/metrics/facets` | Lista de líneas de negocio (`business_types`) y límites de fecha. | respuesta `FacetsResponse` |

**Parámetros que envía la UI (`TopCategoriesParams`)**

| Parámetro | Valor | Por qué |
|---|---|---|
| `operation_type` | `income` | El valor por defecto de la API es `outcome`. |
| `limit` | `20` | Máximo de la API (rango 1–20, si no, 422). Trae todas las categorías para calcular el total real. |
| `business_type` | `B2B` o `B2C` | Una llamada por línea. |
| `start_date`, `end_date` | rango activo | Opcionales. |

**Respuesta (`CategoryEntry`)**

| Campo | Tipo | Significado |
|---|---|---|
| `category` | `Category` | `suppliers`, `sales`, `operational`, `administrative` u `others`. |
| `operation_type` | `OperationType` | Repite el parámetro enviado. |
| `total_amount` | `number` | Suma de montos de la categoría. Filas ordenadas de mayor a menor. |

**Cálculos del cliente** (la API no los entrega)

- **Total del grupo:** suma de `total_amount` de todas las filas de la línea.
- **Porcentaje de una fila:** `total_amount / total del grupo`.
- **Datos del gráfico:** el total de B2B y el total de B2C.

**Casos límite**

1. **Menos de 5 categorías.** Con ingresos solo existen `sales` y `others`: máximo 2 filas por línea (con `outcome` hay 4). La UI muestra solo las filas existentes, sin rellenar hasta 5.
2. **Una línea sin ingresos en el rango.** La API responde 200 con `[]`. Esa tabla muestra `EmptyState` "Sin ingresos de {B2B|B2C} en este rango" y total `$0`, sin columna de porcentaje (no se divide entre 0). El gráfico se dibuja con esa barra en 0.
3. **Ambas líneas sin ingresos.** No se dibuja el gráfico: `EmptyState` "Sin ingresos para comparar en este rango".
4. **Falla una de las dos llamadas.** La sección que falló muestra su error y el gráfico no se dibuja (muestra "No hay datos de ambas líneas para comparar"). La otra sección sigue visible.
5. **Las facetas no filtran por línea.** `FacetsResponse.categories` es global: no sirve para saber qué categorías tiene cada línea. Las filas salen siempre de la respuesta de `categories/top`.
