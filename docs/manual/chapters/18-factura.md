## 18. Facturación

### 18.1 Para qué sirve

<!-- PROSA:factura.proposito -->
Emite facturas electrónicas a partir de las ventas ya registradas, obteniendo el **CAE** (el código de autorización de la AFIP) a través del servicio de facturación.

No toda venta necesita factura: se emite cuando el cliente la pide. La venta se registra siempre; la factura es un paso posterior y optativo.
<!-- /PROSA -->


### 18.2 Cómo llegar

<!-- PROSA:factura.navegacion -->
> _Pendiente de redacción — completar con la ruta de menú real de la aplicación_
<!-- /PROSA -->


### 18.3 Acciones disponibles


#### 18.3.1 Crear factura

<!-- PROSA:factura.crearFactura.pasos -->
1. Ubique la venta a facturar.
2. Seleccione los **ítems** a incluir y la cantidad de cada uno. No se puede facturar más cantidad de la que se vendió.
3. Cargue los datos del comprobante: **CUIT del emisor**, **punto de venta**, **tipo de factura** y **método de pago**.
4. Confirme.

El sistema arma la factura, calcula el total con los ítems seleccionados y la envía al servicio de facturación. Cuando vuelve el **CAE** con su fecha de vencimiento, la factura queda emitida.

> Si el servicio de facturación no responde o no devuelve un CAE, **no se emite nada**: la operación se cancela por completo y no queda una factura a medias. Reintente más tarde; si el problema persiste, avise al equipo técnico.
<!-- /PROSA -->


**Datos a completar**

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `cuit_emisor` | Número entero | **Sí** | — |
| `punto_venta` | Número entero | **Sí** | — |
| `factura_tipo` | Número entero | **Sí** | — |
| `metodo_pago` | Número entero | **Sí** | — |
| `test` | Sí / No | **Sí** | — |
| `usuario_id` | Número entero | **Sí** | — |
| `items` | Lista | **Sí** | — |


*Detalle de `Factura item`*

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `venta_item_id` | Número entero | **Sí** | — |
| `cantidad` | Número entero | **Sí** | Mínimo 1 |
| `subtotal` | Número | **Sí** | Mínimo 0 |


### 18.5 Otras validaciones del módulo

| Mensaje | Se produce en |
| --- | --- |
| Usuario no encontrado | Create |
| Ítem de venta {itemDto.venta_item_id} no encontrado | Create |
| Cantidad solicitada ({itemDto.cantidad}) mayor a la vendida ({ventaItem.cantidad}) | Create |
| La API de ARCA no devolvió un CAE válido | Create |
| Error al conectar con la API de ARCA | Enviar afacturador arca |
