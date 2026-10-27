# Guía didáctica: componentes y flujo CRUD

Esta guía acompaña a la app. La pantalla está dividida visualmente en cuatro etapas numeradas y el código en componentes pequeños. La regla central es: **un componente presenta una parte de la interfaz; `App.js` coordina; `productService.js` habla con Supabase**.

## 1. Mapa de la aplicación

```text
App.js (estado y coordinación)
├── SectionHeading       títulos y explicación de cada etapa
├── ConnectionBanner     resultado de la prueba de conexión
├── ProductForm          campos + validación local
├── InventorySummary     conteo + suma de precios
└── ProductList          FlatList del inventario
    └── ProductCard      una fila con acciones UPDATE / DELETE

App.js → productService.js → supabase.js → Supabase
```

Los componentes de interfaz **no importan `supabase.js` ni escriben consultas**. Solo reciben datos y funciones por props. Así cada pieza tiene una responsabilidad pequeña y es más fácil seguir el recorrido.

## 2. Las cuatro secciones visibles

### 01 · Conexión con Supabase

**Componente:** `src/components/ConnectionBanner.js`  
**Sección en pantalla:** número 01.

El banner recibe dos props:

- `status`: uno de `checking`, `connected` o `error`.
- `error`: texto con el motivo del fallo; solo se presenta si `status === 'error'`.

No hace la conexión. `App.js` realiza la llamada y le pasa el resultado. El banner traduce ese valor técnico a una señal fácil de entender: “Conectando”, “Conectado” o “No se pudo conectar”. El punto cambia a rojo en error y el detalle aparece en una caja debajo.

### 02 · Crear o actualizar un producto

**Componente:** `src/components/ProductForm.js`  
**Sección en pantalla:** número 02.

El título depende de `editingProduct` en `App.js`:

- `editingProduct === null`: formulario vacío; guardar hará **CREATE / INSERT**.
- `editingProduct` contiene una fila: campos precargados; guardar hará **UPDATE** sobre su `id`.

#### Cómo funcionan los campos

El formulario conserva tres estados locales:

```js
const [name, setName] = useState(initialProduct?.producto ?? '');
const [description, setDescription] = useState(initialProduct?.descripcion ?? '');
const [price, setPrice] = useState(initialProduct ? String(initialProduct.precio) : '');
```

`useState` recuerda el valor escrito. Cada `TextInput` es controlado: `value` muestra el valor del estado y `onChangeText` llama al setter cuando se escribe. El estado vive aquí porque las pulsaciones pertenecen al formulario; el padre solo necesita el objeto completo al guardar.

`initialProduct` permite reutilizar el mismo componente para alta y edición. `useEffect` observa ese prop: cuando cambia el producto seleccionado, copia sus campos a los estados locales. Además, `App.js` asigna una `key` que depende del id seleccionado. Cambiar de id remonta el formulario y evita que se mezclen valores de dos productos.

#### Proceso de `submit()`

1. Lee los valores actuales de los tres estados.
2. Convierte el precio: `price.replace(',', '.')` permite escribir `120,50`; `Number(...)` lo vuelve número para PostgreSQL.
3. `name.trim()` elimina espacios al inicio y al final. Si el resultado queda vacío, muestra un `Alert` y termina con `return`.
4. Comprueba que el precio no esté vacío, sea finito (`Number.isFinite`) y no sea negativo. Si una regla falla, avisa y termina sin enviar nada.
5. Construye un objeto con el esquema esperado por la tabla:

   ```js
   {
     producto: name.trim(),
     descripcion: description.trim(),
     precio: numericPrice,
   }
   ```

6. Llama a la prop `onSave(objeto)`. **Aquí termina el formulario:** no importa Supabase ni decide CREATE/UPDATE.

La prop `saving` viene del padre. Mientras vale `true`, el botón muestra “Guardando…” y `disabled` impide que otro toque envíe la misma acción dos veces. En modo edición aparece también **Cancelar edición**; `onCancel()` avisa al padre, que limpia la fila seleccionada.

### 03 · Resumen del inventario

**Componente:** `src/components/InventorySummary.js`  
**Sección en pantalla:** número 03.

Recibe `products`, el mismo arreglo que usará la lista. No consulta la base y no guarda otra copia del total:

- `products.length` cuenta cuántas filas hay.
- `reduce` suma los precios, empezando con total `0`.
- `Number(product.precio || 0)` convierte a número y usa cero si el valor falta.
- `formatMoney` fija dos decimales para mostrar el valor.

El total es un dato **derivado**: sale de `products`. Esto evita tener que acordarse de cambiar tanto la lista como otra variable de total al crear, editar o borrar.

### 04 · Consultar productos

**Componentes:** `src/components/ProductList.js` y `src/components/ProductCard.js`  
**Sección en pantalla:** número 04.

#### `ProductList` y `FlatList`

`ProductList` recibe `products`, `loading`, `error`, una cabecera y callbacks. Su `FlatList` configura:

- `data={products}`: arreglo de filas para mostrar.
- `keyExtractor`: convierte `product.id` a texto. El id es estable si cambia el orden; el índice no lo es.
- `renderItem`: recibe `{ item, index }` y crea una tarjeta. `item` es la fila; `index` solo decora el número que aparece en ella.
- `ListHeaderComponent`: incluye las secciones 01–04 antes de las filas, dentro del mismo desplazamiento.
- `ListEmptyComponent`: decide qué mostrar si no hay filas. Durante carga muestra un indicador; si hay error no tapa el mensaje del banner; si la lectura terminó bien pero no hay filas muestra “Aún no hay productos”.
- `refreshing` y `onRefresh`: enlazan el gesto de deslizar hacia abajo con `refreshProducts()`.

`FlatList` está diseñada para listas y recicla/renderiza elementos según se necesitan en pantalla. Cada fila recibe como `key` el id real de la base, para que React pueda actualizar la tarjeta correcta.

#### `ProductCard` y los botones

La tarjeta recibe `product`, `index`, `onEdit` y `onDelete`. Presenta nombre, descripción y precio formateado. No modifica la lista por sí misma.

- **Editar · UPDATE:** ejecuta `onEdit(product)`. `ProductList` reenvía el callback a `App.js`. `App` asigna el objeto a `editingProduct`, el encabezado de etapa 02 cambia y `ProductForm` carga los valores.
- **Eliminar · DELETE:** ejecuta `onDelete(product)`. La lista reenvía el evento a `App.js`; el padre pide confirmación antes de tocar Supabase.

Los botones incluyen `accessibilityLabel` con el nombre del producto para ser identificables con lectores de pantalla.

## 3. `App.js`: el padre que coordina

`App.js` conserva el estado compartido. No es “dueño” de cada detalle visual; combina los componentes y pasa props.

| Estado | Inicial | Lo utiliza |
| --- | --- | --- |
| `products` | `[]` | `InventorySummary` y `ProductList`. |
| `editingProduct` | `null` | Decide el modo CREATE/UPDATE y rellena `ProductForm`. |
| `connection` | `checking` | `ConnectionBanner`. |
| `loading` | `true` | `ProductList` y su estado de carga. |
| `saving` | `false` | Deshabilita el botón de `ProductForm`. |
| `error` | `''` | Se muestra en `ConnectionBanner`. |

### `connectAndLoad()` y `useEffect`

`useEffect` ejecuta `connectAndLoad()` cuando `App` aparece por primera vez. El orden es importante:

1. Pone el estado en `checking` y limpia un mensaje viejo.
2. Llama `testConnection()`, que intenta leer un id con `limit(1)`.
3. Si la llamada pasa, marca conexión correcta.
4. Llama `refreshProducts()` para hacer la lectura de inventario completa.
5. Si cualquiera falla, `catch` guarda `requestError.message`, cambia el estado a `error` y termina la carga.

La prueba y la lectura cumplen propósitos distintos: `testConnection` da una comprobación pequeña y explícita; `getProducts` trae los registros para dibujar la pantalla.

### `refreshProducts()`

1. `setLoading(true)` activa el indicador.
2. `setError('')` quita un error anterior para no conservar avisos resueltos.
3. `await getProducts()` espera a la respuesta de red.
4. Si responde, `setProducts(data)` actualiza el arreglo central; React vuelve a renderizar resumen y lista.
5. Si falla, `catch` conserva el mensaje y marca conexión con error.
6. `finally` ejecuta `setLoading(false)` tanto en éxito como en error.

La función se envuelve en `useCallback` sin dependencias porque no lee ningún estado externo. Esto mantiene una referencia estable al pasarla a listas y efectos.

### `handleSave(formValues)`

1. Activa `saving`.
2. Revisa `editingProduct`.
3. Si contiene fila, llama `updateProduct(editingProduct.id, formValues)`; si es `null`, llama `createProduct(formValues)`.
4. Si la mutación responde, limpia el modo edición.
5. Vuelve a llamar `refreshProducts()` para leer el estado persistido en Supabase.
6. Si la mutación lanza error, `catch` muestra un `Alert`.
7. `finally` apaga `saving`, incluso si hubo error.

### `handleDelete(product)`

1. `Alert.alert()` muestra nombre del registro y dos acciones.
2. **Cancelar** no tiene una operación de red asociada.
3. Solo el callback `onPress` del botón destructivo llama `deleteProduct(product.id)`.
4. Si la misma fila estaba seleccionada para edición, se limpia `editingProduct`.
5. `refreshProducts()` vuelve a consultar la tabla.
6. Un error se muestra en otro `Alert`; los demás productos no se borran.

## 4. `productService.js`: las cinco funciones de datos

El servicio es la frontera entre React Native y el SDK de Supabase. Las funciones aceptan valores simples y revisan cada `error`. Si Supabase devuelve error, `throw error` lo propaga al `try/catch` que inició la operación.

| Función | Método de Supabase | Qué hace |
| --- | --- | --- |
| `testConnection()` | `.select('id').limit(1)` | Lee como máximo un identificador para comprobar acceso. |
| `getProducts()` | `.select('*').order('created_at', { ascending: false })` | Lee todos los campos y ordena del más reciente al más antiguo. |
| `createProduct(product)` | `.insert(product)` | Añade una fila. No manda `id` ni fecha; los genera la base. |
| `updateProduct(id, product)` | `.update(product).eq('id', id)` | Actualiza columnas donde el id coincide. `eq` es el filtro equivalente a `WHERE`. |
| `deleteProduct(id)` | `.delete().eq('id', id)` | Borra únicamente la fila con ese id. |

Antes de cada consulta, `getClient()` verifica que `supabase.js` haya podido crear el cliente. Si falta `.env`, se lanza un mensaje de configuración claro en vez de fallar con un error críptico.

## 5. Recorridos de extremo a extremo

### CREATE: alta de ejemplo

Supongamos que se escribe **Café**, descripción **De Veracruz** y precio **120.50**:

```text
TextInput actualiza estado local del ProductForm
  → submit valida y prepara { producto: "Café", descripcion: "De Veracruz", precio: 120.5 }
  → onSave manda el objeto a App.handleSave
  → editingProduct es null → App llama createProduct
  → productService envía INSERT a public.productos
  → refreshProducts vuelve a ejecutar SELECT
  → setProducts causa el nuevo render de tarjetas y resumen
```

### UPDATE: editar precio

```text
ProductCard llama onEdit(product)
  → ProductList reenvía el callback
  → App asigna editingProduct
  → ProductForm carga initialProduct
  → submit valida los nuevos valores
  → App llama updateProduct(id, datos)
  → Supabase ejecuta UPDATE ... WHERE id = id
  → refreshProducts actualiza la vista desde la base
```

### DELETE: cancelar vs. confirmar

```text
ProductCard llama onDelete(product)
  → App abre Alert de confirmación
  ├── Cancelar: no se llama al servicio
  └── Eliminar: deleteProduct(id) → DELETE filtrado por id → nueva lectura
```

## 6. Tabla y reglas en Supabase

[`supabase.sql`](./supabase.sql) define `public.productos`:

| Campo | Uso | Regla |
| --- | --- | --- |
| `id` | Identidad de la fila | Lo genera PostgreSQL. |
| `producto` | Nombre visible | Requerido, de 1 a 100 caracteres. |
| `descripcion` | Detalle opcional | Máximo 500 caracteres. |
| `precio` | Importe | Requerido, numérico y no negativo. |
| `created_at` | Fecha de creación | Se completa con `now()`. |

RLS significa *Row Level Security*: Postgres evalúa políticas para permitir o bloquear operaciones por rol. Las políticas de esta actividad permiten CRUD sin login para simplificar la demostración; una aplicación real debe limitar acceso a usuarios identificados.

## 7. Glosario de lectura

- **Estado:** valor que React conserva; al cambiarlo, las piezas que lo usan vuelven a renderizar.
- **Prop:** dato o callback que el padre pasa al hijo.
- **Callback:** función que el hijo recibe y llama para avisar que ocurrió una acción.
- **`async` / `await`:** permite esperar una respuesta de red sin congelar la interfaz.
- **CRUD:** crear, leer, actualizar y eliminar.
- **RLS:** políticas que deciden quién puede leer y modificar filas de la base.
- **Dato derivado:** cálculo que se obtiene de otro estado, como sumar precios a partir de `products`.

## 8. Errores frecuentes

| Síntoma | Qué revisar |
| --- | --- |
| Falta configurar Supabase | `.env` debe estar dentro de `SupabaseCRUD`, las variables deben comenzar con `EXPO_PUBLIC_` y Expo debe reiniciarse después de editarlo. |
| `Invalid API key` | Project URL y publishable key deben ser del mismo proyecto. Nunca usar `service_role` en la app. |
| `relation productos does not exist` | Ejecutar `supabase.sql` en el proyecto correcto y verificar esquema `public`. |
| Error de permisos/RLS | Revisar que exista una política para la operación que se intenta realizar. |
| Conecta, pero falla READ | Leer el detalle en `ConnectionBanner`; comprobar tabla y política SELECT. |

## Tecnologías

React Native · Expo SDK 58 · Supabase JavaScript Client · PostgreSQL · Row Level Security
