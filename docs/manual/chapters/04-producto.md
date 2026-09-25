## 4. Productos

### 4.1 Para qué sirve

<!-- PROSA:producto.proposito -->
Es el catálogo: todo lo que el negocio vende, con su nombre, su código, su precio y su unidad de medida. Es la base de la que se alimentan la pantalla de venta, el stock y las promociones.

Cada producto se vende **por unidad** o **por peso**, según la unidad de medida que se le asigne. Esa elección atraviesa todo el sistema: define cómo se carga en la venta, cómo se cuenta el stock y cómo se cargan los precios de compra.

Los precios funcionan en dos niveles: el **precio base** del producto y, opcionalmente, un **precio propio por almacén** que lo reemplaza en ese punto de venta. Si un almacén no tiene precio propio, se aplica el precio base.
<!-- /PROSA -->


### 4.2 Cómo llegar

En el menú lateral, abra **Productos** y elija **Lista de productos**.


La pantalla se titula *Lista de productos*.


![Pantalla Lista de productos](../capturas/producto-pantalla.png)


### 4.3 Acciones disponibles


#### 4.3.1 Importar

<!-- PROSA:producto.importar.pasos -->
Carga o actualiza el catálogo completo desde una planilla de Excel. Es la vía para las actualizaciones masivas de precios y para la puesta en marcha inicial.

La planilla tiene que traer una hoja llamada **Productos**, con los nombres de columna en la primera fila. Son obligatorias `sku`, `nombre` y `precio_base`; las demás son opcionales:

`barcode`, `descripcion`, `categoria`, `unidad`, `es_por_gramos`, `proveedor`, `activo`, `precio_almacen1`, `en_oferta`, `precio_oferta`, `stock_unidades`, `stock_gramos`.

Pasos:

1. Prepare la planilla. Cada fila es un producto y el **SKU es la clave**: si ya existe, se actualiza; si no, se crea.
2. Elija el **almacén** sobre el que se aplican el precio propio y el stock de la planilla.
3. Suba el archivo y confirme.

Al terminar, el sistema informa cuántos productos creó, cuántos actualizó, cuántos eliminó, qué categorías nuevas dio de alta, cuántos precios y stocks tocó, y cualquier advertencia.

> ⚠️ **La importación es destructiva.** Todo producto del catálogo cuyo SKU **no figure en la planilla se elimina de forma definitiva**, y el stock cargado en la planilla **pisa** el que había en el sistema. Exporte el catálogo antes de importar y trabaje sobre esa base, no sobre una planilla armada desde cero.
>
> El sistema rechaza el archivo si hay SKU o códigos de barras repetidos, o si falta el SKU, el nombre o el precio de alguna fila: en ese caso no se importa nada. El producto de carga rápida nunca se elimina, aunque no figure en la planilla.
<!-- /PROSA -->


**Filtros disponibles**

| Filtro | Tipo | Obligatorio | Observación |
| --- | --- | --- | --- |
| `almacenId` | string | No | — |


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| Debe adjuntarse el archivo Excel en el campo "file" (multipart/form-data). | <!-- PROSA:producto.error.debe-adjuntarse-el-archivo-excel-en-el-campo-file-multipart- --> No se adjuntó ningún archivo. Seleccione la planilla `.xlsx` antes de confirmar la importación. <!-- /PROSA --> |
| almacenId es obligatorio y debe ser un entero mayor a 0. | <!-- PROSA:producto.error.almacenid-es-obligatorio-y-debe-ser-un-entero-mayor-a-0 --> Falta indicar sobre qué almacén se aplica la importación. Elija el punto de venta al que corresponden los precios y el stock de la planilla. <!-- /PROSA --> |


#### 4.3.2 Buscar

<!-- PROSA:producto.buscar.pasos -->
El buscador combina varios criterios a la vez:

- **Nombre** (búsqueda parcial: alcanza con una parte).
- **SKU** o **código de barras** (coincidencia exacta).
- **Categoría** y **unidad de medida**.
- **Solo con stock**, para dejar fuera lo agotado.
- **En oferta**, para ver los productos con precio promocional.
- **Fecha de actualización del precio**, para detectar los precios que quedaron viejos.

También puede ordenar el resultado por **precio final**, de menor a mayor o al revés.

> Los filtros por oferta y el orden por precio final dependen del almacén: el sistema necesita saber en qué punto de venta está mirando, porque el precio puede diferir entre almacenes.
<!-- /PROSA -->


**Filtros disponibles**

| Filtro | Tipo | Obligatorio | Observación |
| --- | --- | --- | --- |
| `(dto)` | Ver DTO `BuscarProductoDto` | **Sí** | — |


#### 4.3.3 Buscar fast

<!-- PROSA:producto.buscarFast.pasos -->
Es la búsqueda que usa la pantalla de venta: devuelve los resultados con menos datos por producto para responder en el acto mientras se tipea. Trabaja sobre el mismo catálogo y aplica los mismos precios que la búsqueda completa.
<!-- /PROSA -->


**Filtros disponibles**

| Filtro | Tipo | Obligatorio | Observación |
| --- | --- | --- | --- |
| `(dto)` | Ver DTO `BuscarProductoFastDto` | **Sí** | — |


#### 4.3.4 Upsert precio

<!-- PROSA:producto.upsertPrecio.pasos -->
Fija un precio propio para un producto en un almacén determinado, que reemplaza al precio base en ese punto de venta.

1. Abra el producto y entre a la gestión de precios por almacén.
2. Elija el **almacén** y cargue el **precio**, que tiene que ser mayor a cero.
3. Si el producto va **en oferta**, marque la opción y cargue el **precio de oferta**, también mayor a cero. Sin precio de oferta, la oferta no se puede activar.
4. Confirme.

Cada cambio queda asentado en el historial de precios con su valor anterior, el nuevo, la fecha y el responsable.
<!-- /PROSA -->


**Datos a completar**

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `producto_id` | Número entero | **Sí** | — |
| `almacen_id` | Número entero | **Sí** | — |
| `precio` | Número | **Sí** | Mínimo 0.01. Debe ser mayor a cero |
| `moneda` | Texto | No | — |
| `inOferta` | Sí / No | No | — |
| `precioOferta` | Número | No | Mínimo 0.01. Debe ser mayor a cero |


#### 4.3.5 Remove precio

<!-- PROSA:producto.removePrecio.pasos -->
Quita el precio propio de un almacén. A partir de ese momento, el producto vuelve a venderse allí al **precio base** del catálogo.
<!-- /PROSA -->


#### 4.3.6 Get precio

<!-- PROSA:producto.getPrecio.pasos -->
Muestra el precio que rige para el producto en un almacén: el propio del almacén si lo tiene cargado, o el precio base si no. Si hay una oferta vigente, indica también el precio promocional.
<!-- /PROSA -->


**Filtros disponibles**

| Filtro | Tipo | Obligatorio | Observación |
| --- | --- | --- | --- |
| `almacenId` | string | No | — |


#### 4.3.7 Historial precios

<!-- PROSA:producto.historialPrecios.pasos -->
Muestra todos los cambios de precio de un producto: qué valor tenía, a cuánto pasó, cuándo, quién lo cambió y desde dónde. Distingue los cambios de **precio base** de los de **precio por almacén**, e incluye el momento en que un precio por almacén fue eliminado.

Es el respaldo ante un reclamo por un precio, y la forma de ver cómo evolucionó el costo de un artículo en el tiempo.
<!-- /PROSA -->


**Filtros disponibles**

| Filtro | Tipo | Obligatorio | Observación |
| --- | --- | --- | --- |
| `(dto)` | Ver DTO `QueryPrecioHistorialDto` | **Sí** | — |


#### 4.3.8 Find by barcode

<!-- PROSA:producto.findByBarcode.pasos -->
Es la búsqueda que dispara el lector de código de barras: al pasar el producto por el lector, el sistema lo identifica y lo agrega al mostrador.
<!-- /PROSA -->


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| No existe producto con barcode {barcode} | <!-- PROSA:producto.error.no-existe-producto-con-barcode --> El código leído no corresponde a ningún producto del catálogo. Puede ser un producto sin dar de alta, o un código cargado con un error. Búsquelo por nombre; si no está, dele de alta con ese código de barras. <!-- /PROSA --> |


#### 4.3.9 Get all

<!-- PROSA:producto.getAll.pasos -->
1. En el menú lateral, abra **Productos** y elija **Lista de productos**.
2. Recorra el catálogo o use el buscador para llegar a un producto puntual.

La lista muestra, de cada producto, su nombre, su código, su categoría, su unidad y el precio vigente en el almacén activo.
<!-- /PROSA -->


#### 4.3.10 Get one

<!-- PROSA:producto.getOne.pasos -->
Haga clic en el producto para ver su ficha: código, nombre, descripción, categoría, unidad, proveedor, precio base, precio vigente en el almacén y existencia actual.
<!-- /PROSA -->


#### 4.3.11 Create

<!-- PROSA:producto.create.pasos -->
1. Entre a **Productos → Lista de productos** y presione el botón para crear un producto.
2. Cargue el **nombre** y elija la **unidad de medida**. La unidad es la que define si el producto se vende por pieza o por peso, así que revísela antes de confirmar.
3. Complete **descripción**, **categoría**, **proveedor** y **código de barras** si los tiene.
4. Cargue el **precio base**.
5. Confirme.

Sobre los códigos:

- Si no carga un **SKU**, el sistema lo genera solo, tomando las primeras letras del nombre y agregando una cadena al azar (por ejemplo, `COCA-4F2XQ1`). El SKU no puede repetirse.
- El **código de barras** es opcional, pero cargarlo es lo que permite vender pasando el lector por el producto.

> Si el código de barras corresponde a un producto que había sido dado de baja, el sistema **reactiva ese producto** con los datos nuevos en lugar de crear uno duplicado.
<!-- /PROSA -->


**Datos a completar**

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `sku` | Texto | No | Máx. 50 caracteres |
| `nombre` | Texto | **Sí** | Máx. 255 caracteres |
| `descripcion` | Texto | No | — |
| `unidad_id` | Número entero | **Sí** | — |
| `categoria_id` | Número entero | No | — |
| `precioBase` | Número | **Sí** | — |
| `barcode` | Texto | No | Máx. 100 caracteres |
| `es_por_gramos` | Sí / No | No | — |
| `inOferta` | Sí / No | No | — |
| `almacenId` | Número entero | No | Mínimo 1 |
| `proveedorNombre` | Texto | No | Máx. 255 caracteres |


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| Unidad no encontrada | <!-- PROSA:producto.error.unidad-no-encontrada --> La unidad de medida elegida ya no existe. Seleccione otra de la lista, o cárguela primero en **Unidades de medida**. <!-- /PROSA --> |
| El producto con SKU "{dto.sku}" ya existe. | <!-- PROSA:producto.error.el-producto-con-sku-ya-existe --> Ese SKU ya está en uso por otro producto. Cargue uno distinto, o deje el campo vacío para que el sistema lo genere. <!-- /PROSA --> |
| Ya existe un producto activo con ese código de barras. Nombre: "{existingBarcode.nombre}". | <!-- PROSA:producto.error.ya-existe-un-producto-activo-con-ese-codigo-de-barras-nombre --> Otro producto activo ya usa ese código de barras; el mensaje indica cuál. Verifique si está cargando un producto que ya existe. Si de verdad son distintos, uno de los dos necesita otro código. <!-- /PROSA --> |


#### 4.3.12 Update carga rapida

<!-- PROSA:producto.updateCargaRapida.pasos -->
La **carga rápida** es el producto genérico que permite cobrar algo que todavía no está en el catálogo, cargando el importe a mano en la venta.

Desde aquí se ajustan su nombre, su descripción y su precio de referencia. El resto de sus datos no se modifica: el sistema depende de ellos para reconocerlo.
<!-- /PROSA -->


**Datos a completar**

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `nombre` | string | **Sí** | — |
| `descripcion` | string | No | — |
| `precioBase` | number | **Sí** | — |
| `inOferta` | boolean | No | — |


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| No existe el producto de carga rápida | <!-- PROSA:producto.error.no-existe-el-producto-de-carga-rapida --> Falta el producto genérico de carga rápida, que el sistema necesita para cobrar artículos fuera del catálogo. Avise al administrador: hay que darlo de alta. <!-- /PROSA --> |


#### 4.3.13 Update

<!-- PROSA:producto.update.pasos -->
Corrige los datos de un producto: nombre, descripción, categoría, unidad, proveedor, código de barras y precio base.

Cada cambio de **precio base** queda registrado en el historial de precios, con el valor anterior, el nuevo, la fecha y el usuario que lo hizo.
<!-- /PROSA -->


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| Producto {id} no encontrado | <!-- PROSA:producto.error.producto-no-encontrado --> El producto fue eliminado o el enlace es viejo. Vuelva a la lista y búsquelo de nuevo. <!-- /PROSA --> |
| Carga rápida: solo se puede editar {allowed.join(', ')}. No permitido: {invalid.join(', ')} | <!-- PROSA:producto.error.carga-rapida-solo-se-puede-editar-no-permitido --> El producto de **carga rápida** es especial: el sistema lo usa para cobrar algo que no está en el catálogo. Solo se le pueden cambiar el nombre, la descripción y el precio; su unidad, su categoría y su código de barras son fijos y no pueden tocarse. <!-- /PROSA --> |
| Unidad no encontrada | <!-- PROSA:producto.error.unidad-no-encontrada --> La unidad de medida elegida ya no existe. Seleccione otra de la lista, o cárguela primero en **Unidades de medida**. <!-- /PROSA --> |
| Producto {id} no encontrado | <!-- PROSA:producto.error.producto-no-encontrado --> El producto fue eliminado o el enlace es viejo. Vuelva a la lista y búsquelo de nuevo. <!-- /PROSA --> |


#### 4.3.14 Borrar logico

<!-- PROSA:producto.borrarLogico.pasos -->
Da de baja un producto: deja de aparecer en la venta y en las búsquedas, pero **no se borra**. Su historial de ventas y de movimientos se conserva intacto.

> Un producto **no puede darse de baja mientras tenga existencia** en algún almacén. Si el sistema lo rechaza, primero deje el stock en cero —vendiéndolo o registrándolo como insumo— y vuelva a intentarlo.
<!-- /PROSA -->


### 4.5 Otras validaciones del módulo

| Mensaje | Se produce en |
| --- | --- |
| La hoja "Productos" no contiene filas de datos. | Importar desde excel |
| Almacen {almacenId} no encontrado | Importar desde excel |
| El archivo no es un Excel (.xlsx) válido. | Parsear excel |
| El archivo no contiene hojas. | Parsear excel |
| Faltan columnas obligatorias en la hoja "Productos": {faltantes.join(', ')} | Parsear excel |
| {         message: 'El Excel tiene errores de validación. No se importó nada.',         errores,       } | Parsear excel |
| Fila {fila.fila} ({fila.sku}): unidad "{fila.unidad}" no existe en el sistema. | Resolver unidad |
| Fila {fila.fila} ({fila.sku}): no se indicó unidad y no existe una unidad por defecto. | Resolver unidad |
| El producto de carga rápida no permite: {action} | Assert not quick producto |
| Producto {productoId} no encontrado | Get precio final |
| almacenId debe ser un entero mayor a 0 | Validar almacen producto |
| Almacen {parsedAlmacenId} no encontrado | Validar almacen producto |
| Producto {id} no encontrado | Remove |
| sortBy invalido. Valores permitidos: precioFinal | Buscar con filtros |
| sortDir invalido. Valores permitidos: asc, desc | Buscar con filtros |
| Para ordenar por precioFinal es obligatorio enviar almacenId | Buscar con filtros |
| Para filtrar por inOferta es obligatorio enviar almacenId | Buscar con filtros |
| page debe ser un entero mayor a 0 | Buscar con filtros |
| limit debe ser un entero mayor a 0 | Buscar con filtros |
| Producto {id} no encontrado | Borrar logicamente |
| No se puede borrar el producto porque tiene stock en uno o mas almacenes. | Borrar logicamente |
| El precio debe ser > 0 | Upsert precio almacen |
| Si inOferta es true, debe enviarse precioOferta > 0 | Upsert precio almacen |
| Producto {producto_id} no encontrado | Upsert precio almacen |
| No existe override para producto {producto_id} en almacén {almacen_id} | Remove precio almacen |
