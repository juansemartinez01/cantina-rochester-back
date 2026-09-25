## Anexo B. Catálogo completo de mensajes del sistema

| Mensaje | Módulo |
| --- | --- |
| {           mensaje: `Ya existe una promoción ACTIVA con el código "${dto.codigo}"`,           productos,         } | Promociones |
| {         message: 'Role sync failed',         peerStatus: res.status,         peerBody: body.slice(0, 500),       } | Roles |
| {         message: 'El Excel tiene errores de validación. No se importó nada.',         errores,       } | Productos |
| {field} es obligatorio | Gastos |
| Admin role cannot be deleted | Roles |
| Almacen {almacenId} no encontrado | Productos |
| Almacen {dto.almacenId} no encontrado | Ventas |
| Almacen {id} no encontrado | Promociones |
| Almacén {id} no encontrado | Almacenes |
| Almacén {id} no encontrado | Almacenes |
| Almacen {parsedAlmacenId} no encontrado | Productos |
| Almacen no encontrado | Gastos |
| almacenId debe ser un entero mayor a 0 | Productos |
| almacenId es obligatorio y debe ser un entero mayor a 0. | Productos |
| Cada pago debe tener un monto mayor a 0 | Ventas |
| Cantidad solicitada ({itemDto.cantidad}) mayor a la vendida ({ventaItem.cantidad}) | Facturación |
| cantidadMin no puede ser mayor que cantidadMax | Stock |
| Carga rápida: solo se puede editar {allowed.join(', ')}. No permitido: {invalid.join(', ')} | Productos |
| Categoria {id} no encontrada | Categorías |
| Categoria {id} no encontrada | Categorías |
| Categoria de gasto no encontrada | Gastos |
| Cuenta corriente {cuentaCorrienteId} no encontrada | Cuentas corrientes |
| Cuenta corriente {cuentaId} no encontrada | Cuentas corrientes |
| Cuenta corriente {cuentaId} no encontrada | Cuentas corrientes |
| Cuenta corriente {id} no encontrada | Cuentas corrientes |
| cuentaCorrienteId es obligatorio para ventas a cuenta corriente | Ventas |
| cuentaCorrienteId solo puede enviarse con tipoCobro CUENTA_CORRIENTE | Ventas |
| Debe adjuntarse el archivo Excel en el campo "file" (multipart/form-data). | Productos |
| detalle_pago es obligatorio para ingresos con tipo OTRO | Ingresos |
| detalle_pago es obligatorio para movimientos con medio_pago OTRO | Caja |
| detalle_pago es obligatorio para pagos con medio OTRO | Cuentas corrientes |
| detalle_pago es obligatorio para pagos con medio OTRO | Ventas |
| detalle_pago no puede superar {DETALLE_PAGO_MAX_LENGTH} caracteres | Caja |
| detalle_pago no puede superar {DETALLE_PAGO_MAX_LENGTH} caracteres | Cuentas corrientes |
| detalle_pago no puede superar {DETALLE_PAGO_MAX_LENGTH} caracteres | Ingresos |
| detalle_pago no puede superar {DETALLE_PAGO_MAX_LENGTH} caracteres | Ventas |
| El ajuste #{index + 1} debe incluir un motivo | Ventas |
| El ajuste #{index + 1} debe tener un valor mayor a 0 | Ventas |
| El archivo no contiene hojas. | Productos |
| El archivo no es un Excel (.xlsx) válido. | Productos |
| El código "{dto.codigo}" pertenece a una promoción INACTIVA. Por favor use otro código. | Promociones |
| El descuento porcentual #{index + 1} no puede superar el 100% | Ventas |
| El monto del ajuste debe ser mayor a 0 | Cuentas corrientes |
| El monto del pago debe ser mayor a 0 | Cuentas corrientes |
| El movimiento #{movimientoId} ya está anulado | Caja |
| El nombre de usuario '{dto.usuario}' ya está en uso. | Usuarios |
| El pago inicial ({totalPagos}) no puede superar el total de la venta ({total}). Para generar saldo a favor, registrar un pago posterior en cuenta corriente. | Ventas |
| El precio debe ser > 0 | Productos |
| El producto {prod.nombre} se maneja por gramos: usar 'cantidad_gramos' (y no 'cantidad'). | Promociones |
| El producto {prod.nombre} se maneja por gramos: usar 'cantidad_gramos' (y no 'cantidad'). | Promociones |
| El producto {prod.nombre} se maneja por piezas: usar 'cantidad' (y no 'cantidad_gramos'). | Promociones |
| El producto {prod.nombre} se maneja por piezas: usar 'cantidad' (y no 'cantidad_gramos'). | Promociones |
| El producto {producto.nombre} debe tener precioUnitario mayor a 0 | Órdenes de compra |
| El producto {producto.nombre} se maneja por gramos: enviar 'cantidad_gramos' (y NO 'cantidad'). | Órdenes de compra |
| El producto {producto.nombre} se maneja por gramos: enviar 'cantidad_gramos' y no 'cantidad'. | Órdenes de compra |
| El producto {producto.nombre} se maneja por piezas: enviar 'cantidad' (y NO 'cantidad_gramos'). | Órdenes de compra |
| El producto {producto.nombre} se maneja por piezas: enviar 'cantidad' y no 'cantidad_gramos'. | Órdenes de compra |
| El producto con SKU "{dto.sku}" ya existe. | Productos |
| El producto de carga rápida no permite: {action} | Productos |
| El rango de fechas es invalido: desde > hasta | Gastos |
| El rango de monto es invalido: minMonto > maxMonto | Gastos |
| El rol con id {rolId} no existe. | Usuarios |
| En un TRASPASO, origen_almacen y destino_almacen deben ser distintos. | Movimientos de stock |
| Error al conectar con la API de ARCA | Facturación |
| Este movimiento proviene de un pago de cuenta corriente. Debe anularse desde cuenta corriente. | Caja |
| Extracción {id} no encontrada | Extracciones de caja |
| Extracción {id} no encontrada | Extracciones de caja |
| Faltan columnas obligatorias en la hoja "Productos": {faltantes.join(', ')} | Productos |
| Fila {fila.fila} ({fila.sku}): no se indicó unidad y no existe una unidad por defecto. | Productos |
| Fila {fila.fila} ({fila.sku}): unidad "{fila.unidad}" no existe en el sistema. | Productos |
| Fondos insuficientes en {dto.origen}. Total disponible: ${totalDisponible.toFixed(2)} | Extracciones de caja |
| Fondos insuficientes en {nuevoOrigen}. Disponible: ${disponible.toFixed(2)} | Extracciones de caja |
| Gasto no encontrado | Gastos |
| Gasto no encontrado | Gastos |
| Gasto no encontrado | Gastos |
| Gasto no encontrado | Gastos |
| ID inválido | Ventas |
| ID inválido | Ventas |
| Invalid role sync secret | Roles |
| Ítem de venta {itemDto.venta_item_id} no encontrado | Facturación |
| La API de ARCA no devolvió un CAE válido | Facturación |
| La cantidad de la promocion debe ser mayor a 0 | Ventas |
| La categoria de gasto "{nombre}" ya existe | Gastos |
| La categoria de gasto esta inactiva | Gastos |
| La cuenta corriente {cuentaCorrienteId} esta inactiva | Cuentas corrientes |
| La descripcion del ajuste es obligatoria | Cuentas corrientes |
| La hoja "Productos" no contiene filas de datos. | Productos |
| La orden de compra {id} esta anulada y no puede editarse | Órdenes de compra |
| La orden de compra {id} no tiene almacen asociado | Órdenes de compra |
| La orden de compra {id} no tiene almacen asociado para revertir stock | Órdenes de compra |
| La orden de compra {id} no tiene items para revertir | Órdenes de compra |
| La orden de compra {id} ya esta anulada | Órdenes de compra |
| La promocion {promo.id} tiene cantidad invalida para producto {producto.id} | Ventas |
| La promocion {promo.id} tiene gramos invalidos para producto {producto.id} | Ventas |
| La sesión de caja #{sesion.id} está cerrada. No se pueden registrar movimientos. | Caja |
| La suma de pagos ({totalPagos}) debe coincidir con el total de la venta ({total}) | Ventas |
| La venta debe incluir al menos un item o una promocion | Ventas |
| La venta debe incluir al menos un pago | Ventas |
| La venta debe incluir al menos un pago | Ventas |
| limit debe ser un entero mayor a 0 | Productos |
| Los descuentos no pueden dejar el total de la venta en negativo. Total calculado: {total} | Ventas |
| medio debe ser EFECTIVO, TRANSFERENCIA, QR, DEBITO, CREDITO u OTRO | Ventas |
| medio_pago debe ser EFECTIVO, TRANSFERENCIA, QR, DEBITO, CREDITO, OTRO o BANCARIZADO | Caja |
| medio_pago debe ser EFECTIVO, TRANSFERENCIA, QR, DEBITO, CREDITO, OTRO o BANCARIZADO | Caja |
| monto debe ser > 0 | Gastos |
| motivoAnulacion es obligatorio | Órdenes de compra |
| Movimiento {id} no encontrado | Movimientos de stock |
| Movimiento {id} no encontrado | Movimientos de stock |
| Movimiento #{movimientoId} no encontrado | Caja |
| nivel_optimo debe ser mayor o igual a nivel_minimo | Parámetros de reposición |
| nivel_optimo debe ser mayor o igual a nivel_minimo | Parámetros de reposición |
| No existe el producto de carga rápida | Productos |
| No existe override para producto {producto_id} en almacén {almacen_id} | Productos |
| No existe producto con barcode {barcode} | Productos |
| No existe stock para producto {producto.id} en almacen {almacenId} | Ventas |
| No existe stock para producto {productoId} en almacén {almacenId} | Stock |
| No hay caja abierta para el almacen {almacenId} | Cuentas corrientes |
| No hay caja abierta para el almacén {almacenId} | Caja |
| No hay caja abierta para el almacen {dto.almacenId} | Cuentas corrientes |
| No hay stock actual para revertir el producto {params.producto.id} en almacen {params.almacenId} | Órdenes de compra |
| No se encontró ninguna promoción con el código "{codigo}" | Promociones |
| No se encontró ninguna promoción con el id "{id}" | Promociones |
| No se encontró ninguna promoción con id {id} | Promociones |
| No se encontro ninguna promocion disponible para el almacen {almacenId} | Promociones |
| No se puede borrar el producto porque tiene stock en uno o mas almacenes. | Productos |
| No se puede eliminar la categoria {id} porque tiene productos asociados | Categorías |
| No se puede eliminar la categoria {id} porque tiene productos asociados | Categorías |
| Orden de compra {id} no encontrada | Órdenes de compra |
| Orden de compra {id} no encontrada | Órdenes de compra |
| Orden de compra {id} no encontrada | Órdenes de compra |
| order debe ser ASC o DESC | Caja |
| origen debe ser MANUAL o CUENTA_CORRIENTE | Caja |
| page debe ser un entero mayor a 0 | Productos |
| page y limit deben ser enteros mayores a 0 | Promociones |
| Para filtrar por inOferta es obligatorio enviar almacenId | Productos |
| Para ordenar por precioFinal es obligatorio enviar almacenId | Productos |
| Para un TRASPASO se requieren origen_almacen y destino_almacen. | Movimientos de stock |
| Para una {dto.tipo.toUpperCase()} debe indicarse origen_almacen. | Movimientos de stock |
| Para una ENTRADA debe indicarse destino_almacen. | Movimientos de stock |
| Parametro numerico invalido: {value} | Caja |
| ParametroReorden {id} no encontrado | Parámetros de reposición |
| ParametroReorden {id} no encontrado | Parámetros de reposición |
| Producto {dto.producto_id} no existe | Stock |
| Producto {dto.producto_id} no existe | Stock |
| Producto {i.productoId} no encontrado | Órdenes de compra |
| Producto {i.productoId} no encontrado | Órdenes de compra |
| Producto {id} no encontrado | Productos |
| Producto {id} no encontrado | Productos |
| Producto {id} no encontrado | Productos |
| Producto {id} no encontrado | Productos |
| Producto {itemDto.productoId} no encontrado | Ventas |
| Producto {p.productoId} no encontrado | Promociones |
| Producto {p.productoId} no encontrado | Promociones |
| Producto {producto_id} no encontrado | Productos |
| Producto {producto.id} se vende por gramos: enviar solo cantidad_gramos | Ventas |
| Producto {producto.id} se vende por piezas: enviar solo cantidad | Ventas |
| Producto {productoId} no encontrado | Productos |
| Producto {productoId} no existe | Stock |
| Promocion {promoItem.promocionId} no esta activa | Ventas |
| Promocion {promoItem.promocionId} no esta disponible para el almacen {dto.almacenId} | Ventas |
| Promocion {promoItem.promocionId} no tiene productos | Ventas |
| Promoción con id {id} no encontrada | Promociones |
| Proveedor {id} no encontrado | Proveedores |
| Proveedor {id} no encontrado | Proveedores |
| Proveedor {proveedorId} no encontrado | Órdenes de compra |
| Role {id} not found | Roles |
| Role {id} not found | Roles |
| Role name is required | Roles |
| Role name is required | Roles |
| Sesión de caja #{cajaId} no encontrada | Caja |
| Si inOferta es true, debe enviarse precioOferta > 0 | Productos |
| sortBy invalido. Valores permitidos: precioFinal | Productos |
| sortDir invalido. Valores permitidos: asc, desc | Productos |
| Stock insuficiente para editar la orden. Producto {params.producto.nombre}: disponible {actual.toFixed(3)}g, requerido {Math.abs(deltaGramos).toFixed(3)}g | Órdenes de compra |
| Stock insuficiente para editar la orden. Producto {params.producto.nombre}: disponible {actual}, requerido {Math.abs(deltaPiezas)} | Órdenes de compra |
| Stock no encontrado para producto {dto.producto_id} en almacén {dto.almacen_id} | Stock |
| Stock no encontrado para producto {producto_id} en almacén {almacen_id} | Stock |
| Stock no encontrado para producto {producto_id} en almacén {almacen_id} | Stock |
| tipo debe ser INGRESO, EGRESO o RETIRO | Caja |
| Token invalido | Acceso al sistema |
| Unidad {id} no encontrada | Unidades de medida |
| Unidad {id} no encontrada | Unidades de medida |
| Unidad no encontrada | Productos |
| Unidad no encontrada | Productos |
| Usuario {id} no encontrado | Usuarios |
| Usuario no encontrado | Facturación |
| UsuarioRol {id} no encontrado | Asignación de roles |
| UsuarioRol {id} no encontrado | Asignación de roles |
| Venta con id {dto.ventaId} no encontrada | Ingresos |
| Venta con ID {id} no encontrada | Ventas |
| Venta with ID {id} not found | Ventas |
| Ya existe un producto activo con ese código de barras. Nombre: "{existingBarcode.nombre}". | Productos |
| Ya existe una caja abierta para el almacén {dto.almacen_id} (sesión #{cajaAbierta.id}) | Caja |
| Ya existe una cuenta corriente con documento "{documento}" | Cuentas corrientes |
