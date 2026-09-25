## 6. Movimientos de stock

### 6.1 Para qué sirve

Cualquier entrada o salida de mercadería del depósito.

<!-- PROSA:movimiento-stock.proposito -->
Es el historial de todo lo que entró, salió o se trasladó del depósito, con su fecha, su cantidad y su motivo. Cada venta, cada ingreso de mercadería y cada ajuste deja aquí su rastro.

Es la herramienta para auditar una diferencia de inventario: si el stock de un producto no coincide con el conteo físico, este listado muestra qué operaciones lo modificaron y quién las hizo.
<!-- /PROSA -->


### 6.2 Cómo llegar

En el menú lateral, abra **Stock** y elija **Ingresos Stock**.


La pantalla se titula *Registro de Ingreso de mercadería*.


![Pantalla Registro de Ingreso de mercadería](../capturas/movimiento-stock-pantalla.png)


### 6.3 Acciones disponibles


#### 6.3.1 Get all con filtros

<!-- PROSA:movimiento-stock.getAllConFiltros.pasos -->
1. Acote por rango de fechas, producto, almacén o tipo de movimiento.
2. La lista devuelve los movimientos ordenados del más reciente al más antiguo.

Para seguir un producto puntual, filtre por ese producto y recorra la secuencia: cada fila indica qué operación generó el movimiento.
<!-- /PROSA -->


**Filtros disponibles**

| Filtro | Tipo | Obligatorio | Observación |
| --- | --- | --- | --- |
| `fechaDesde` | string | No | — |
| `fechaHasta` | string | No | — |
| `usuarioId` | string | No | — |
| `tipo` | string | No | — |
| `proveedorId` | string | No | — |
| `page` | string | No | Por defecto: `1` |
| `limit` | string | No | Por defecto: `50` |
| `ordenCampo` | string | No | Por defecto: `fecha` |
| `ordenDireccion` | 'ASC' \| 'DESC' | No | Por defecto: `DESC` |


#### 6.3.2 Get insumos

<!-- PROSA:movimiento-stock.getInsumos.pasos -->
Filtra el historial dejando solo los **consumos internos**: la mercadería que se usó o se dio de baja sin venderse. Sirve para medir cuánto se pierde por rotura o consumo propio en un período.
<!-- /PROSA -->


#### 6.3.3 Get one

<!-- PROSA:movimiento-stock.getOne.pasos -->
Abre el detalle de un movimiento: producto, cantidad, almacenes de origen y destino, fecha, motivo y operación que lo originó.
<!-- /PROSA -->


#### 6.3.4 Create

<!-- PROSA:movimiento-stock.create.pasos -->
Registra un movimiento de mercadería a mano. Qué almacenes hay que indicar depende del tipo:

| Tipo | Qué indicar | Efecto |
| --- | --- | --- |
| Entrada | Almacén de **destino** | Suma existencia en ese almacén. |
| Salida | Almacén de **origen** | Resta existencia de ese almacén. |
| Traspaso | Almacén de **origen** y de **destino**, distintos entre sí | Resta en uno y suma en el otro. |

1. Elija el tipo de movimiento.
2. Seleccione el producto y cargue la cantidad.
3. Indique los almacenes que correspondan según la tabla.
4. Escriba el motivo y confirme.
<!-- /PROSA -->


**Datos a completar**

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `producto_id` | Número entero | **Sí** | Mínimo 1 |
| `origen_almacen` | Número entero | No | Mínimo 1 |
| `destino_almacen` | Número entero | No | Mínimo 1 |
| `cantidad` | Número entero | No | Mínimo 1 |
| `cantidad_gramos` | Número | No | Mínimo 0.001 |
| `tipo` | 'entrada' \| 'salida' \| 'traspaso' \| 'insumo' | **Sí** | Valores: `entrada`, `salida`, `traspaso`, `insumo` |
| `usuario_id` | Número entero | No | Mínimo 1 |
| `motivo` | Texto | No | Máx. 500 caracteres |
| `proveedor_id` | Número entero | No | Mínimo 1 |
| `precioUnitario` | Número | No | Mínimo 0 |
| `precioTotal` | Número | No | Mínimo 0 |


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| Para una ENTRADA debe indicarse destino_almacen. | <!-- PROSA:movimiento-stock.error.para-una-entrada-debe-indicarse-destino-almacen --> Está registrando mercadería que entra, pero no indicó a qué almacén. Seleccione el almacén de destino. <!-- /PROSA --> |
| Para una {dto.tipo.toUpperCase()} debe indicarse origen_almacen. | <!-- PROSA:movimiento-stock.error.para-una-debe-indicarse-origen-almacen --> Está registrando mercadería que sale, pero no indicó de qué almacén. Seleccione el almacén de origen. <!-- /PROSA --> |
| Para un TRASPASO se requieren origen_almacen y destino_almacen. | <!-- PROSA:movimiento-stock.error.para-un-traspaso-se-requieren-origen-almacen-y-destino-almac --> Un traslado necesita los dos extremos. Indique desde qué almacén sale la mercadería y a cuál llega. <!-- /PROSA --> |
| En un TRASPASO, origen_almacen y destino_almacen deben ser distintos. | <!-- PROSA:movimiento-stock.error.en-un-traspaso-origen-almacen-y-destino-almacen-deben-ser-di --> Seleccionó el mismo almacén como origen y destino. Un traslado tiene que ir de un almacén a otro distinto. <!-- /PROSA --> |


#### 6.3.5 Update

<!-- PROSA:movimiento-stock.update.pasos -->
Corrige los datos de un movimiento ya registrado, como el motivo o la observación.
<!-- /PROSA -->


#### 6.3.6 Remove

<!-- PROSA:movimiento-stock.remove.pasos -->
Elimina un movimiento del historial.

> ⚠️ Eliminar un movimiento no devuelve la mercadería al stock. Si lo que necesita es revertir un consumo, use la cancelación de insumo desde la pantalla de Stock, que sí ajusta la existencia.
<!-- /PROSA -->


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| Movimiento {id} no encontrado | <!-- PROSA:movimiento-stock.error.movimiento-no-encontrado --> El movimiento no existe o ya fue eliminado. Refresque el listado. <!-- /PROSA --> |


### 6.5 Otras validaciones del módulo

| Mensaje | Se produce en |
| --- | --- |
| Movimiento {id} no encontrado | Find one |
