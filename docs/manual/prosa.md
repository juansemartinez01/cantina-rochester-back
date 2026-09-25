<!--
  Banco de prosa del manual.

  Este archivo SOBREVIVE a la regeneración de capítulos: es la fuente de
  verdad de todo lo redactado a mano. Se puede editar aquí o directamente en
  docs/manual/chapters/*.md (en ese caso, el próximo scaffold lo recupera).

  NO tocar los marcadores de apertura y cierre: son la clave de cada texto.
-->

<!-- PROSA:almacen.create.pasos -->
Da de alta un punto de venta nuevo: cargue su **nombre** y su **ubicación**.

El almacén nace sin stock y sin precios propios; los productos se venden allí al precio base hasta que se le cargue un precio propio.

> Abrir un almacén es una decisión de configuración con impacto en toda la operación. Conviene coordinarlo con el equipo que implementó el sistema.
<!-- /PROSA -->

<!-- PROSA:almacen.error.almacen-no-encontrado -->
El almacén fue eliminado o el enlace es viejo. Refresque el listado.
<!-- /PROSA -->

<!-- PROSA:almacen.getAll.pasos -->
Lista los almacenes dados de alta, con su nombre y su ubicación.
<!-- /PROSA -->

<!-- PROSA:almacen.getOne.pasos -->
Muestra el detalle de un almacén.
<!-- /PROSA -->

<!-- PROSA:almacen.proposito -->
Define los puntos de venta del negocio. Cada almacén lleva **su propio stock, su propia caja y sus propios precios**: la misma mercadería puede tener existencias y precios distintos en cada uno.

El almacén activo se elige al entrar y figura en la pantalla; todo lo que registre —ventas, movimientos, cobros— se imputa a ese punto de venta.
<!-- /PROSA -->

<!-- PROSA:almacen.remove.pasos -->
Elimina un almacén.

> ⚠️ Un almacén concentra stock, cajas, precios y ventas. No lo elimine si tuvo operación: consulte antes con el equipo técnico.
<!-- /PROSA -->

<!-- PROSA:almacen.update.pasos -->
Corrige el nombre o la ubicación de un almacén.
<!-- /PROSA -->

<!-- PROSA:auth.app-roles.admin -->
**Administrador.** Acceso total: configura el sistema, gestiona usuarios y precios, ve los reportes y cierra cajas.
<!-- /PROSA -->

<!-- PROSA:auth.app-roles.cocina -->
**Cocina.** Ve los pedidos que hay que preparar y marca su avance.
<!-- /PROSA -->

<!-- PROSA:auth.app-roles.vendedor -->
**Vendedor.** Opera el día a día: registra ventas, cobra, y abre y cierra su caja.
<!-- /PROSA -->

<!-- PROSA:auth.getProfile.pasos -->
Muestra el perfil del usuario conectado, con sus datos personales y sus permisos.
<!-- /PROSA -->

<!-- PROSA:auth.jwtconstants.process-env-jwt-secret-defaultsecret -->
Clave interna con la que el sistema firma las sesiones. Es un parámetro técnico del servidor: no se configura desde la aplicación ni el usuario interviene en él.
<!-- /PROSA -->

<!-- PROSA:auth.legacy-role-name-map.app-roles-admin -->
Nombres antiguos que el sistema sigue reconociendo y traduce a **Administrador**: `admin`, `administrador` y `supervisor`. Es para que las cuentas cargadas con la nomenclatura vieja mantengan sus permisos.
<!-- /PROSA -->

<!-- PROSA:auth.legacy-role-name-map.app-roles-cocina -->
Nombre antiguo que el sistema traduce a **Cocina**: `cocina`.
<!-- /PROSA -->

<!-- PROSA:auth.legacy-role-name-map.app-roles-vendedor -->
Nombres antiguos que el sistema traduce a **Vendedor**: `vendedor` y `operador_caja`.
<!-- /PROSA -->

<!-- PROSA:auth.login.pasos -->
1. Abra la dirección del sistema en el navegador.
2. Cargue su **dirección de email** y su **contraseña**.
3. Presione **Iniciar Sesión**.
4. Elija el **espacio de trabajo** con el que va a operar.

Si los datos son correctos, entra a la pantalla de inicio. La sesión queda abierta mientras trabaje y vence después de un tiempo de inactividad: en ese caso vuelva a iniciar sesión.

> Si el sistema rechaza el ingreso, revise que el email esté bien escrito y que la tecla de mayúsculas no esté activada. Si el usuario fue dado de baja, tampoco puede entrar, aunque la contraseña sea correcta: pida al administrador que lo reactive.
<!-- /PROSA -->

<!-- PROSA:auth.me.pasos -->
Muestra los datos de la sesión abierta: nombre, usuario y roles asignados. Es la forma de confirmar con qué cuenta está trabajando.
<!-- /PROSA -->

<!-- PROSA:auth.proposito -->
Controla quién entra al sistema. Cada persona tiene su usuario y su contraseña, y el sistema registra bajo ese nombre todo lo que hace: las ventas que cobra, los movimientos de caja, los ajustes de stock.

Por eso las credenciales son personales y no deben compartirse: la trazabilidad de las operaciones depende de que cada uno trabaje con su propia cuenta.
<!-- /PROSA -->

<!-- PROSA:categoria.create.pasos -->
1. Abra la gestión de categorías con el botón **Gestionar categorías**.
2. Cargue el **nombre** de la categoría.
3. Confirme.

> El nombre no puede repetirse. Conviene definir pocas categorías y claras: son las que después ordenan los reportes.
<!-- /PROSA -->

<!-- PROSA:categoria.error.categoria-no-encontrada -->
La categoría fue eliminada o el enlace es viejo. Refresque el listado.
<!-- /PROSA -->

<!-- PROSA:categoria.error.no-se-puede-eliminar-la-categoria-porque-tiene-productos-aso -->
La categoría todavía agrupa productos, y borrarla los dejaría sin clasificar. Reasigne esos productos a otra categoría y vuelva a intentarlo.
<!-- /PROSA -->

<!-- PROSA:categoria.getAll.pasos -->
Lista las categorías, ordenadas alfabéticamente.
<!-- /PROSA -->

<!-- PROSA:categoria.getOne.pasos -->
Muestra el detalle de una categoría.
<!-- /PROSA -->

<!-- PROSA:categoria.proposito -->
Agrupa los productos por rubro: bebidas, almacén, limpieza, panadería.

Las categorías son lo que permite filtrar el catálogo, ver cuánto vale el stock de un rubro y comparar cuánto vende cada uno.
<!-- /PROSA -->

<!-- PROSA:categoria.remove.pasos -->
Elimina una categoría.

Solo se puede eliminar una categoría **sin productos asociados**. Si tiene productos, primero reasígnelos a otra.
<!-- /PROSA -->

<!-- PROSA:categoria.update.pasos -->
Cambia el nombre de una categoría. Los productos que la tienen asignada pasan a mostrar el nombre nuevo.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.actualizar.pasos -->
Corrige los datos del cliente: nombre, documento, email, teléfono y observaciones. También permite volver a activar una cuenta dada de baja.

El saldo no se edita desde aquí: para corregirlo, registre un **ajuste**.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.crear.pasos -->
1. En el menú lateral, abra **Gestión** y elija **Cuentas corrientes**.
2. Presione el botón para dar de alta una cuenta.
3. Cargue el **nombre** del cliente. Es el único dato obligatorio.
4. Complete, si los tiene, **documento**, **email**, **teléfono** y **observaciones**.
5. Confirme.

La cuenta nace **activa** y con **saldo cero**.

> El documento no puede repetirse: si ya existe otra cuenta con ese número, el sistema lo avisa. Es la forma de evitar dos cuentas para el mismo cliente.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.cuentacorrientemediopago.bancarizado -->
Cobro que ingresa por vía bancaria y no como efectivo en caja.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.cuentacorrientemediopago.credito -->
Pago con tarjeta de crédito.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.cuentacorrientemediopago.debito -->
Pago con tarjeta de débito.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.cuentacorrientemediopago.efectivo -->
Pago en efectivo. Entra a la caja física y se cuenta en el arqueo del cierre.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.cuentacorrientemediopago.otro -->
Cualquier medio que no figure en la lista. Al elegirlo, el sistema **exige describirlo**: es lo que permite reconocerlo después en los reportes.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.cuentacorrientemediopago.qr -->
Pago con código QR desde una billetera virtual.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.cuentacorrientemediopago.transferencia -->
Pago por transferencia bancaria. Conviene anotar el comprobante en la referencia.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.cuentacorrientemovimientotipo.ajuste-credito -->
Corrección manual que **reduce** la deuda del cliente, como una bonificación acordada.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.cuentacorrientemovimientotipo.ajuste-debito -->
Corrección manual que **aumenta** la deuda del cliente.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.cuentacorrientemovimientotipo.deuda -->
Compra a cuenta corriente. Aumenta el saldo: el cliente pasa a deber más.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.cuentacorrientemovimientotipo.pago -->
Cobro recibido. Reduce el saldo y se imputa a las ventas pendientes más antiguas.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.cuentacorrientemovimientotipo.saldo-a-favor -->
Dinero que quedó a favor del cliente porque pagó más de lo que debía. Se descuenta de sus próximas compras.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.cuentacorrienteventaestado.anulada -->
La venta fue anulada, de modo que ya no se le adeuda.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.cuentacorrienteventaestado.pagada -->
La compra quedó saldada por completo.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.cuentacorrienteventaestado.parcial -->
La compra se pagó en parte. Queda un monto pendiente que se cubrirá con los próximos cobros.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.cuentacorrienteventaestado.pendiente -->
La compra está impaga: no se le aplicó ningún pago todavía.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.desactivar.pasos -->
Da de baja la cuenta para que no se le puedan cargar compras nuevas. La cuenta no se borra: su historial y su saldo se conservan, y puede reactivarse en cualquier momento.

> Conviene dar de baja en lugar de eliminar: así se mantiene el respaldo de lo que el cliente compró y pagó.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.error.cuenta-corriente-no-encontrada -->
La cuenta fue eliminada o el enlace es viejo. Vuelva al listado de cuentas corrientes y búsquela de nuevo.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.error.el-monto-del-ajuste-debe-ser-mayor-a-0 -->
El monto del ajuste tiene que ser mayor a cero. Cárguelo siempre en positivo: lo que define si suma o resta es el tipo de ajuste que elija.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.error.el-monto-del-pago-debe-ser-mayor-a-0 -->
No cargó el importe cobrado, o cargó cero. Indique cuánto pagó el cliente.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.error.la-descripcion-del-ajuste-es-obligatoria -->
Todo ajuste manual de saldo tiene que explicar su motivo. Escriba por qué corrige el saldo: es lo que va a permitir entenderlo cuando se revise la cuenta más adelante.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.error.no-hay-caja-abierta-para-el-almacen -->
No se puede cobrar con la caja cerrada: el ingreso tiene que quedar registrado en una sesión. Abra la caja del almacén desde **Caja → Gestión de caja** y vuelva a registrar el pago.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.listar.pasos -->
1. Ingrese a **Gestión → Cuentas corrientes**.
2. Busque por **nombre, documento o email** con el buscador; los tres campos se consultan a la vez.
3. Filtre por estado para ver solo las cuentas **activas** o solo las **inactivas**.
4. Ordene el listado por **nombre**, **saldo** o **fecha de alta**.

El listado se muestra paginado. Ordenar por saldo de mayor a menor es la manera rápida de ver quiénes son los mayores deudores.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.listarMovimientos.pasos -->
Es el extracto de la cuenta: cada deuda, cada pago y cada ajuste, con su fecha, su monto, el **saldo que quedó** después de la operación y el usuario que la registró.

Es la pantalla a la que recurrir cuando un cliente discute el saldo: la secuencia completa muestra cómo se llegó al número actual.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.listarVentas.pasos -->
Muestra las compras que el cliente hizo a cuenta corriente, de la más reciente a la más antigua. De cada una indica el **monto original**, cuánto se le **aplicó** de pagos, cuánto queda **pendiente** y en qué **estado** está. Desde aquí puede abrir el detalle de la venta y ver qué productos llevó.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.obtener.pasos -->
Haga clic en la fila del cliente para abrir su cuenta: datos de contacto, saldo actual, ventas a cuenta y extracto de movimientos.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.obtenerResumen.pasos -->
Al abrir una cuenta, el encabezado resume su situación:

- **Saldo actual**: lo que el cliente debe hoy.
- **Ventas**: cuántas compró a cuenta, por qué monto original, cuánto lleva pagado y cuánto queda pendiente, con el desglose por estado (pendientes, parciales, pagadas, anuladas).
- **Pagos**: cuántos hizo y por qué total.
- **Movimientos**: cuántos registra la cuenta y cuál fue el último.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.proposito -->
Administra el crédito de los clientes que compran ahora y pagan después. Cada cliente tiene una cuenta con su **saldo**, el historial de lo que compró y lo que fue pagando.

Cómo leer el saldo:

- **Saldo positivo**: el cliente **debe** esa cantidad.
- **Saldo cero**: está al día.
- **Saldo negativo**: pagó de más y tiene ese dinero **a favor**, que se aplica a sus próximas compras.

El saldo no se escribe a mano: lo mueve el sistema. Una venta a cuenta corriente lo aumenta, un pago lo reduce, y todo queda asentado en el historial de movimientos con su fecha y su responsable.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.registrarAjuste.pasos -->
Corrige el saldo de una cuenta cuando la diferencia no proviene de una venta ni de un cobro: una bonificación acordada, un error de carga arrastrado, un redondeo.

1. Abra la cuenta y elija registrar un ajuste.
2. Elija el tipo: **ajuste de débito** si el cliente pasa a deber más, **ajuste de crédito** si pasa a deber menos.
3. Cargue el **monto** (siempre en positivo; el tipo define si suma o resta) y una **descripción** que explique el motivo. Ambos son obligatorios.
4. Confirme.

El ajuste modifica el saldo y queda en el historial con su descripción y su responsable.

> Un ajuste no genera movimiento de caja: no entra ni sale dinero. Si el cliente efectivamente pagó, registre un **pago**, no un ajuste.
<!-- /PROSA -->

<!-- PROSA:cuenta-corriente.registrarPago.pasos -->
Registra un cobro a cuenta de la deuda.

1. Abra la cuenta del cliente y elija registrar un pago.
2. Cargue el **monto** cobrado y el **medio de pago**. Si cobra con el medio **Otro**, describa de qué se trata: es obligatorio.
3. Agregue **referencia** u **observación** si necesita dejar constancia (número de transferencia, comprobante).
4. Confirme.

Al confirmar, el sistema hace tres cosas en una sola operación:

- **Imputa el pago a las ventas pendientes, de la más antigua a la más nueva.** Cada venta se marca `PAGADA` si quedó saldada o `PARCIAL` si se cubrió en parte.
- **Descuenta el monto del saldo** del cliente.
- **Registra el ingreso en la caja abierta** del almacén, identificado como cobro de cuenta corriente.

Si el pago supera lo adeudado, el excedente queda como **saldo a favor** del cliente y así se indica en el movimiento.

> Para poder cobrar tiene que haber una **caja abierta** en el almacén: el cobro es dinero que entra y necesita quedar registrado en la sesión de caja.
<!-- /PROSA -->

<!-- PROSA:extraccion.borrar.pasos -->
Elimina un retiro cargado por error. El monto vuelve a quedar disponible en su vía.
<!-- /PROSA -->

<!-- PROSA:extraccion.crear.pasos -->
1. Elija el **origen** del retiro: **efectivo** o **bancarizado**.
2. Cargue el **monto**.
3. Escriba el **motivo**: a dónde va ese dinero (depósito bancario, pago a proveedor, retiro de socios).
4. Confirme.

El monto no puede superar el disponible de esa vía.
<!-- /PROSA -->

<!-- PROSA:extraccion.editar.pasos -->
Corrige un retiro ya registrado: su origen, su monto o su motivo. Si cambia el monto o la vía, el sistema vuelve a verificar que haya fondos suficientes, sin contar la extracción que está editando.
<!-- /PROSA -->

<!-- PROSA:extraccion.error.fondos-insuficientes-en-total-disponible -->
Está intentando retirar más de lo que hay disponible en esa vía; el mensaje indica el tope. Revise el monto, o verifique si el retiro corresponde a la otra vía.
<!-- /PROSA -->

<!-- PROSA:extraccion.getExtraccionesConFiltros.pasos -->
Lista los retiros registrados, de los más recientes a los más antiguos. Puede acotar por **origen** y por **rango de fechas**, y ordenar por fecha u origen.
<!-- /PROSA -->

<!-- PROSA:extraccion.obtenerTotales.pasos -->
Muestra cuánto queda disponible para retirar en cada vía —**efectivo** y **bancarizado**—, calculado como el total cobrado por esa vía menos lo ya extraído.
<!-- /PROSA -->

<!-- PROSA:extraccion.proposito -->
Registra el dinero que se saca del circuito de ventas: los retiros de efectivo y las transferencias hacia las cuentas del negocio.

El sistema lleva el **disponible** por vía, separando el efectivo del dinero bancarizado. El disponible de cada vía es lo cobrado por ella menos lo que ya se retiró.
<!-- /PROSA -->

<!-- PROSA:factura.crearFactura.pasos -->
1. Ubique la venta a facturar.
2. Seleccione los **ítems** a incluir y la cantidad de cada uno. No se puede facturar más cantidad de la que se vendió.
3. Cargue los datos del comprobante: **CUIT del emisor**, **punto de venta**, **tipo de factura** y **método de pago**.
4. Confirme.

El sistema arma la factura, calcula el total con los ítems seleccionados y la envía al servicio de facturación. Cuando vuelve el **CAE** con su fecha de vencimiento, la factura queda emitida.

> Si el servicio de facturación no responde o no devuelve un CAE, **no se emite nada**: la operación se cancela por completo y no queda una factura a medias. Reintente más tarde; si el problema persiste, avise al equipo técnico.
<!-- /PROSA -->

<!-- PROSA:factura.proposito -->
Emite facturas electrónicas a partir de las ventas ya registradas, obteniendo el **CAE** (el código de autorización de la AFIP) a través del servicio de facturación.

No toda venta necesita factura: se emite cuando el cliente la pide. La venta se registra siempre; la factura es un paso posterior y optativo.
<!-- /PROSA -->

<!-- PROSA:gastos.activarCategoria.pasos -->
Vuelve a habilitar una categoría dada de baja para poder usarla en gastos nuevos.
<!-- /PROSA -->

<!-- PROSA:gastos.actualizar.pasos -->
Corrige un gasto ya cargado: fecha, monto, descripción, notas, categoría o almacén. El monto tiene que seguir siendo mayor a cero.
<!-- /PROSA -->

<!-- PROSA:gastos.actualizarCategoria.pasos -->
Cambia el nombre o la descripción de una categoría. Los gastos ya cargados con ella pasan a mostrar el nombre nuevo.
<!-- /PROSA -->

<!-- PROSA:gastos.crear.pasos -->
1. En el menú lateral, abra **Gestión** y elija **Gastos**.
2. Presione el botón para registrar un gasto nuevo.
3. Cargue la **fecha**, el **monto** y una **descripción**. Los tres son obligatorios.
4. Elija la **categoría** (alquiler, servicios, sueldos…) y el **almacén** al que corresponde. Ambos son opcionales, pero cargarlos es lo que permite después agrupar y comparar.
5. Agregue **notas** si necesita más detalle.
6. Confirme.

El gasto queda registrado con origen **manual**.

> Solo se pueden usar categorías **activas**. Si la que busca no aparece, revise si fue dada de baja en **Categorías de gasto**.
<!-- /PROSA -->

<!-- PROSA:gastos.crearCategoria.pasos -->
1. Entre a la gestión de categorías de gasto.
2. Cargue el **nombre** (obligatorio) y, si quiere, una **descripción** que aclare qué entra en esa categoría.
3. Confirme. La categoría nace activa.

> Los nombres no pueden repetirse, sin importar mayúsculas o minúsculas: "Servicios" y "servicios" se consideran la misma categoría.
<!-- /PROSA -->

<!-- PROSA:gastos.desactivarCategoria.pasos -->
Retira una categoría de la lista de opciones: deja de poder elegirse al cargar un gasto nuevo. Los gastos que ya la tenían asignada la conservan y siguen figurando en los reportes.
<!-- /PROSA -->

<!-- PROSA:gastos.eliminar.pasos -->
Da de baja un gasto cargado por error. El gasto deja de aparecer en el listado y de sumar en los totales, pero **no se borra**: queda archivado y puede volver a verse activando la opción de incluir eliminados.
<!-- /PROSA -->

<!-- PROSA:gastos.eliminarDef.pasos -->
Borra el gasto de forma **definitiva**. No se puede deshacer y el registro deja de existir.

> ⚠️ Reserve esta opción para datos de prueba. Para un gasto real, aunque haya sido un error, conviene la baja común: mantiene la trazabilidad de lo que se cargó.
<!-- /PROSA -->

<!-- PROSA:gastos.error.el-rango-de-fechas-es-invalido-desde-hasta -->
La fecha inicial es posterior a la final. Invierta el orden de las fechas.
<!-- /PROSA -->

<!-- PROSA:gastos.error.el-rango-de-monto-es-invalido-minmonto-maxmonto -->
El monto mínimo es mayor que el máximo. Corrija el rango.
<!-- /PROSA -->

<!-- PROSA:gastos.error.gasto-no-encontrado -->
El gasto fue eliminado o el enlace es viejo. Refresque el listado y búsquelo de nuevo.
<!-- /PROSA -->

<!-- PROSA:gastos.error.monto-debe-ser-0 -->
El monto de un gasto tiene que ser mayor a cero. Revise el importe cargado.
<!-- /PROSA -->

<!-- PROSA:gastos.gastoorigen.manual -->
Gasto cargado a mano en la pantalla de Gastos.
<!-- /PROSA -->

<!-- PROSA:gastos.gastoorigen.orden-compra -->
Gasto que el sistema generó solo al registrarse un ingreso de mercadería. Está atado a esa orden de compra: si la orden se anula, el gasto se elimina automáticamente.
<!-- /PROSA -->

<!-- PROSA:gastos.listar.pasos -->
1. Ingrese a **Gestión → Gastos**.
2. Acote con los filtros disponibles:
   - **Fechas**: desde y hasta.
   - **Búsqueda de texto**: consulta a la vez la descripción, las notas y el nombre de la categoría.
   - **Categoría**, **almacén** y **origen** (manual o generado por una orden de compra).
   - **Rango de montos**: mínimo y máximo.
3. Ordene por fecha, monto, categoría o fecha de carga.

Junto al listado, el sistema muestra el **total del período filtrado**: es la suma de todos los gastos que cumplen los filtros, no solo los de la página que está viendo. Sirve para responder "cuánto gasté en servicios este mes" en un solo paso.
<!-- /PROSA -->

<!-- PROSA:gastos.listarCategorias.pasos -->
Muestra las categorías con las que se clasifican los gastos, ordenadas alfabéticamente. Por defecto se listan solo las **activas**; puede pedir ver también las dadas de baja.
<!-- /PROSA -->

<!-- PROSA:gastos.obtener.pasos -->
Haga clic en la fila para ver el detalle del gasto: fecha, monto, descripción, notas, categoría, almacén y origen.
<!-- /PROSA -->

<!-- PROSA:gastos.proposito -->
Registra todo lo que el negocio paga: alquiler, servicios, sueldos, mantenimiento, mercadería. Es el contrapeso de los ingresos y la base para saber cuánto quedó de resultado en un período.

Los gastos llegan por dos caminos: los que se **cargan a mano** en esta pantalla y los que el sistema **genera solo** cada vez que se registra un ingreso de mercadería de un proveedor. La columna de origen distingue unos de otros.
<!-- /PROSA -->

<!-- PROSA:ingreso.crear.pasos -->
El sistema registra estos ingresos **por su cuenta** cada vez que se cobra una venta: no hay que cargarlos a mano.

El registro manual queda reservado para correcciones puntuales, y exige indicar a qué venta corresponde el cobro.
<!-- /PROSA -->

<!-- PROSA:ingreso.obtenerIngresosConFiltros.pasos -->
1. En el menú lateral, abra **Gestión** y elija **Historial de ventas**.
2. Acote por:
   - **Fechas**: desde y hasta.
   - **Medio de pago**.
   - **Almacén**.
   - **Rango de montos**: mínimo y máximo.
   - **Venta** puntual, si quiere ver los cobros de una operación.
3. Ordene por fecha, monto o medio de pago.

Los resultados se muestran paginados, del más reciente al más antiguo.
<!-- /PROSA -->

<!-- PROSA:ingreso.proposito -->
Es el registro del dinero que entra por las ventas, desglosado por medio de pago. Cada cobro de una venta deja aquí su asiento.

Es la pantalla con la que se responde "cuánto se facturó en el período y cómo se cobró": cuánto en efectivo, cuánto por transferencia, cuánto con tarjeta.
<!-- /PROSA -->

<!-- PROSA:ingreso.resumen.pasos -->
Resume lo cobrado en el período filtrado, agrupado por medio de pago. Es el dato que se usa para el control diario y para conciliar contra lo que informa el banco.
<!-- /PROSA -->

<!-- PROSA:intro.bienvenida -->
El **Sistema de Gestión Comercial** concentra en un solo lugar la operación diaria del comercio: el cobro en el mostrador, el control del dinero en caja, el inventario, la compra a proveedores y el crédito otorgado a los clientes.

Cada operación que se registra actualiza automáticamente todo lo demás. Al cobrar una venta el sistema descuenta el stock de los productos, impacta el importe en la caja abierta y, si el cliente compra con cuenta corriente, le suma la deuda. No hace falta cargar la misma información dos veces ni conciliar planillas por separado.

El sistema trabaja siempre sobre un **almacén**: el punto de venta en el que usted está operando. Cada almacén tiene su propio stock, su propia caja y sus propios precios, y se identifica arriba a la derecha de la pantalla.
<!-- /PROSA -->

<!-- PROSA:intro.uso -->
Cada capítulo corresponde a un módulo del sistema y sigue siempre la misma estructura: **para qué sirve**, **cómo llegar** desde el menú, las **acciones disponibles** paso a paso, y los **estados y opciones** que maneja ese módulo.

Convenciones tipográficas:

- Los textos en **negrita** son botones, opciones de menú y campos tal como aparecen en pantalla.
- Los textos en `código` son nombres de campo o valores que el sistema usa internamente y que usted puede llegar a ver en un mensaje.
- Los bloques que empiezan con **>** son advertencias o aclaraciones importantes.
- Las tablas de **"Mensajes que puede mostrar el sistema"** listan los avisos de error de cada pantalla junto con qué hacer ante cada uno. Cuando un mensaje incluye algo entre llaves, como `{id}`, en la pantalla real ese lugar lo ocupa un dato concreto.

Si busca una función puntual, use el índice del comienzo. Al final encontrará el catálogo completo de mensajes del sistema y un glosario de los términos del negocio.
<!-- /PROSA -->

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

<!-- PROSA:movimiento-stock.error.en-un-traspaso-origen-almacen-y-destino-almacen-deben-ser-di -->
Seleccionó el mismo almacén como origen y destino. Un traslado tiene que ir de un almacén a otro distinto.
<!-- /PROSA -->

<!-- PROSA:movimiento-stock.error.movimiento-no-encontrado -->
El movimiento no existe o ya fue eliminado. Refresque el listado.
<!-- /PROSA -->

<!-- PROSA:movimiento-stock.error.para-un-traspaso-se-requieren-origen-almacen-y-destino-almac -->
Un traslado necesita los dos extremos. Indique desde qué almacén sale la mercadería y a cuál llega.
<!-- /PROSA -->

<!-- PROSA:movimiento-stock.error.para-una-debe-indicarse-origen-almacen -->
Está registrando mercadería que sale, pero no indicó de qué almacén. Seleccione el almacén de origen.
<!-- /PROSA -->

<!-- PROSA:movimiento-stock.error.para-una-entrada-debe-indicarse-destino-almacen -->
Está registrando mercadería que entra, pero no indicó a qué almacén. Seleccione el almacén de destino.
<!-- /PROSA -->

<!-- PROSA:movimiento-stock.getAllConFiltros.pasos -->
1. Acote por rango de fechas, producto, almacén o tipo de movimiento.
2. La lista devuelve los movimientos ordenados del más reciente al más antiguo.

Para seguir un producto puntual, filtre por ese producto y recorra la secuencia: cada fila indica qué operación generó el movimiento.
<!-- /PROSA -->

<!-- PROSA:movimiento-stock.getInsumos.pasos -->
Filtra el historial dejando solo los **consumos internos**: la mercadería que se usó o se dio de baja sin venderse. Sirve para medir cuánto se pierde por rotura o consumo propio en un período.
<!-- /PROSA -->

<!-- PROSA:movimiento-stock.getOne.pasos -->
Abre el detalle de un movimiento: producto, cantidad, almacenes de origen y destino, fecha, motivo y operación que lo originó.
<!-- /PROSA -->

<!-- PROSA:movimiento-stock.proposito -->
Es el historial de todo lo que entró, salió o se trasladó del depósito, con su fecha, su cantidad y su motivo. Cada venta, cada ingreso de mercadería y cada ajuste deja aquí su rastro.

Es la herramienta para auditar una diferencia de inventario: si el stock de un producto no coincide con el conteo físico, este listado muestra qué operaciones lo modificaron y quién las hizo.
<!-- /PROSA -->

<!-- PROSA:movimiento-stock.remove.pasos -->
Elimina un movimiento del historial.

> ⚠️ Eliminar un movimiento no devuelve la mercadería al stock. Si lo que necesita es revertir un consumo, use la cancelación de insumo desde la pantalla de Stock, que sí ajusta la existencia.
<!-- /PROSA -->

<!-- PROSA:movimiento-stock.update.pasos -->
Corrige los datos de un movimiento ya registrado, como el motivo o la observación.
<!-- /PROSA -->

<!-- PROSA:orden-compra.actualizar.pasos -->
Corrige un ingreso ya registrado: los productos, las cantidades o los precios. El sistema recalcula el stock por la diferencia y actualiza el gasto asociado para que refleje el nuevo total.
<!-- /PROSA -->

<!-- PROSA:orden-compra.anular.pasos -->
Deja sin efecto un ingreso de mercadería cargado por error.

1. Ubique la orden en el listado y abra el menú **…** de su fila.
2. Elija **Anular**.
3. Escriba el **motivo de la anulación**. Es obligatorio y queda registrado.
4. Confirme.

Al anular, el sistema deshace el ingreso completo: **descuenta del stock** la mercadería que había sumado, registra los movimientos de reversión con el motivo indicado, y **elimina el gasto** que se había generado. La orden no se borra: queda en el listado con estado `ANULADA`, su motivo y su fecha de anulación.

> Una orden anulada no se puede volver a activar. Si el ingreso era correcto pero tenía un error de carga, conviene corregirlo con **Actualizar** en lugar de anularlo.
<!-- /PROSA -->

<!-- PROSA:orden-compra.ingresarStock.pasos -->
1. En el menú lateral, abra **Stock** y elija **Ingresos Stock**.
2. Presione **Registrar Ingreso**.
3. Seleccione el **proveedor**. Si todavía no está dado de alta, cárguelo con **Gestionar proveedores**.
4. Agregue los productos recibidos. De cada uno indique la **cantidad** y el **precio unitario** al que lo compró.
5. Revise el total y confirme.

Al confirmar, en una sola operación el sistema: suma la mercadería al stock, registra los movimientos y crea el gasto asociado a la compra.

> El precio unitario se carga según cómo se venda el producto: por pieza si se vende por unidad, **por gramo** si se vende por peso. Preste atención a esto al cargar mercadería a granel: un precio por kilo cargado como precio por gramo multiplica el costo por mil.
<!-- /PROSA -->

<!-- PROSA:orden-compra.obtener.pasos -->
Haga clic en la orden para ver su detalle: proveedor, fecha, productos recibidos con cantidades y precios, total, y el gasto que generó.
<!-- /PROSA -->

<!-- PROSA:orden-compra.obtenerTodas.pasos -->
1. Ingrese a **Stock → Ingresos Stock**.
2. Acote por **fecha desde**, **fecha hasta** y **proveedor**. Por defecto la pantalla muestra el último mes.
3. **Actualizar** vuelve a aplicar los filtros; **Limpiar filtros** los descarta.

El encabezado resume el período filtrado: **órdenes en el período**, **productos recibidos**, **monto total** y **proveedores distintos**.
<!-- /PROSA -->

<!-- PROSA:orden-compra.ordencompraestado.activa -->
El ingreso está vigente: la mercadería está sumada al stock y el gasto, registrado.
<!-- /PROSA -->

<!-- PROSA:orden-compra.ordencompraestado.anulada -->
El ingreso fue revertido. El stock volvió a su estado anterior y el gasto se eliminó. Queda en el listado con su motivo de anulación, a efectos de auditoría.
<!-- /PROSA -->

<!-- PROSA:orden-compra.proposito -->
Registra la mercadería que llega de un proveedor. Es el circuito de compra: se cargan los productos recibidos con su precio, y el sistema hace el resto en una sola operación.

Al confirmar un ingreso, el sistema suma la mercadería al stock del almacén, deja el movimiento correspondiente en el historial y **genera automáticamente el gasto** por el total de la compra, imputado a ese proveedor. No hay que cargar el gasto por separado.
<!-- /PROSA -->

<!-- PROSA:parametro-reorden.create.pasos -->
1. Elija el **producto**.
2. Cargue el **nivel mínimo** y el **nivel óptimo**. El óptimo tiene que ser mayor o igual que el mínimo.
3. Confirme.

Las cantidades se expresan en la unidad del producto: en piezas si se vende por unidad, en gramos si se vende por peso.

> Un criterio práctico para el mínimo: lo que se vende en el tiempo que tarda el proveedor en entregar, más un margen. Para el óptimo, lo que se vende entre dos pedidos.
<!-- /PROSA -->

<!-- PROSA:parametro-reorden.error.nivel-optimo-debe-ser-mayor-o-igual-a-nivel-minimo -->
El nivel óptimo quedó por debajo del mínimo, y así los números no tienen sentido: el óptimo es la existencia a la que se quiere llegar reponiendo. Revise los dos valores.
<!-- /PROSA -->

<!-- PROSA:parametro-reorden.error.parametroreorden-no-encontrado -->
El parámetro fue eliminado o el enlace es viejo. Refresque el listado.
<!-- /PROSA -->

<!-- PROSA:parametro-reorden.getAll.pasos -->
Lista los productos que tienen parámetros cargados, con su nivel mínimo y su nivel óptimo.
<!-- /PROSA -->

<!-- PROSA:parametro-reorden.getOne.pasos -->
Muestra los parámetros de reposición de un producto.
<!-- /PROSA -->

<!-- PROSA:parametro-reorden.proposito -->
Define, para cada producto, a partir de qué existencia hay que reponer y hasta cuánto conviene comprar.

Se cargan dos números:

- **Nivel mínimo**: el punto de alerta. Cuando el stock llega ahí, hay que reponer.
- **Nivel óptimo**: la existencia a la que conviene volver al comprar.

Es lo que convierte el control de stock en una tarea previsible: en lugar de mirar el depósito, se mira qué productos cayeron por debajo de su mínimo.
<!-- /PROSA -->

<!-- PROSA:parametro-reorden.remove.pasos -->
Quita los parámetros de un producto. Deja de avisar cuando su existencia baja.
<!-- /PROSA -->

<!-- PROSA:parametro-reorden.update.pasos -->
Ajusta los niveles de un producto. Conviene revisarlos cuando cambia la demanda —temporada alta, un producto que empezó a girar más rápido.
<!-- /PROSA -->

<!-- PROSA:producto.borrarLogico.pasos -->
Da de baja un producto: deja de aparecer en la venta y en las búsquedas, pero **no se borra**. Su historial de ventas y de movimientos se conserva intacto.

> Un producto **no puede darse de baja mientras tenga existencia** en algún almacén. Si el sistema lo rechaza, primero deje el stock en cero —vendiéndolo o registrándolo como insumo— y vuelva a intentarlo.
<!-- /PROSA -->

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

<!-- PROSA:producto.buscarFast.pasos -->
Es la búsqueda que usa la pantalla de venta: devuelve los resultados con menos datos por producto para responder en el acto mientras se tipea. Trabaja sobre el mismo catálogo y aplica los mismos precios que la búsqueda completa.
<!-- /PROSA -->

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

<!-- PROSA:producto.error.almacenid-es-obligatorio-y-debe-ser-un-entero-mayor-a-0 -->
Falta indicar sobre qué almacén se aplica la importación. Elija el punto de venta al que corresponden los precios y el stock de la planilla.
<!-- /PROSA -->

<!-- PROSA:producto.error.carga-rapida-solo-se-puede-editar-no-permitido -->
El producto de **carga rápida** es especial: el sistema lo usa para cobrar algo que no está en el catálogo. Solo se le pueden cambiar el nombre, la descripción y el precio; su unidad, su categoría y su código de barras son fijos y no pueden tocarse.
<!-- /PROSA -->

<!-- PROSA:producto.error.debe-adjuntarse-el-archivo-excel-en-el-campo-file-multipart- -->
No se adjuntó ningún archivo. Seleccione la planilla `.xlsx` antes de confirmar la importación.
<!-- /PROSA -->

<!-- PROSA:producto.error.el-producto-con-sku-ya-existe -->
Ese SKU ya está en uso por otro producto. Cargue uno distinto, o deje el campo vacío para que el sistema lo genere.
<!-- /PROSA -->

<!-- PROSA:producto.error.no-existe-el-producto-de-carga-rapida -->
Falta el producto genérico de carga rápida, que el sistema necesita para cobrar artículos fuera del catálogo. Avise al administrador: hay que darlo de alta.
<!-- /PROSA -->

<!-- PROSA:producto.error.no-existe-producto-con-barcode -->
El código leído no corresponde a ningún producto del catálogo. Puede ser un producto sin dar de alta, o un código cargado con un error. Búsquelo por nombre; si no está, dele de alta con ese código de barras.
<!-- /PROSA -->

<!-- PROSA:producto.error.producto-no-encontrado -->
El producto fue eliminado o el enlace es viejo. Vuelva a la lista y búsquelo de nuevo.
<!-- /PROSA -->

<!-- PROSA:producto.error.unidad-no-encontrada -->
La unidad de medida elegida ya no existe. Seleccione otra de la lista, o cárguela primero en **Unidades de medida**.
<!-- /PROSA -->

<!-- PROSA:producto.error.ya-existe-un-producto-activo-con-ese-codigo-de-barras-nombre -->
Otro producto activo ya usa ese código de barras; el mensaje indica cuál. Verifique si está cargando un producto que ya existe. Si de verdad son distintos, uno de los dos necesita otro código.
<!-- /PROSA -->

<!-- PROSA:producto.findByBarcode.pasos -->
Es la búsqueda que dispara el lector de código de barras: al pasar el producto por el lector, el sistema lo identifica y lo agrega al mostrador.
<!-- /PROSA -->

<!-- PROSA:producto.getAll.pasos -->
1. En el menú lateral, abra **Productos** y elija **Lista de productos**.
2. Recorra el catálogo o use el buscador para llegar a un producto puntual.

La lista muestra, de cada producto, su nombre, su código, su categoría, su unidad y el precio vigente en el almacén activo.
<!-- /PROSA -->

<!-- PROSA:producto.getOne.pasos -->
Haga clic en el producto para ver su ficha: código, nombre, descripción, categoría, unidad, proveedor, precio base, precio vigente en el almacén y existencia actual.
<!-- /PROSA -->

<!-- PROSA:producto.getPrecio.pasos -->
Muestra el precio que rige para el producto en un almacén: el propio del almacén si lo tiene cargado, o el precio base si no. Si hay una oferta vigente, indica también el precio promocional.
<!-- /PROSA -->

<!-- PROSA:producto.historialPrecios.pasos -->
Muestra todos los cambios de precio de un producto: qué valor tenía, a cuánto pasó, cuándo, quién lo cambió y desde dónde. Distingue los cambios de **precio base** de los de **precio por almacén**, e incluye el momento en que un precio por almacén fue eliminado.

Es el respaldo ante un reclamo por un precio, y la forma de ver cómo evolucionó el costo de un artículo en el tiempo.
<!-- /PROSA -->

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

<!-- PROSA:producto.proposito -->
Es el catálogo: todo lo que el negocio vende, con su nombre, su código, su precio y su unidad de medida. Es la base de la que se alimentan la pantalla de venta, el stock y las promociones.

Cada producto se vende **por unidad** o **por peso**, según la unidad de medida que se le asigne. Esa elección atraviesa todo el sistema: define cómo se carga en la venta, cómo se cuenta el stock y cómo se cargan los precios de compra.

Los precios funcionan en dos niveles: el **precio base** del producto y, opcionalmente, un **precio propio por almacén** que lo reemplaza en ese punto de venta. Si un almacén no tiene precio propio, se aplica el precio base.
<!-- /PROSA -->

<!-- PROSA:producto.removePrecio.pasos -->
Quita el precio propio de un almacén. A partir de ese momento, el producto vuelve a venderse allí al **precio base** del catálogo.
<!-- /PROSA -->

<!-- PROSA:producto.update.pasos -->
Corrige los datos de un producto: nombre, descripción, categoría, unidad, proveedor, código de barras y precio base.

Cada cambio de **precio base** queda registrado en el historial de precios, con el valor anterior, el nuevo, la fecha y el usuario que lo hizo.
<!-- /PROSA -->

<!-- PROSA:producto.updateCargaRapida.pasos -->
La **carga rápida** es el producto genérico que permite cobrar algo que todavía no está en el catálogo, cargando el importe a mano en la venta.

Desde aquí se ajustan su nombre, su descripción y su precio de referencia. El resto de sus datos no se modifica: el sistema depende de ellos para reconocerlo.
<!-- /PROSA -->

<!-- PROSA:producto.upsertPrecio.pasos -->
Fija un precio propio para un producto en un almacén determinado, que reemplaza al precio base en ese punto de venta.

1. Abra el producto y entre a la gestión de precios por almacén.
2. Elija el **almacén** y cargue el **precio**, que tiene que ser mayor a cero.
3. Si el producto va **en oferta**, marque la opción y cargue el **precio de oferta**, también mayor a cero. Sin precio de oferta, la oferta no se puede activar.
4. Confirme.

Cada cambio queda asentado en el historial de precios con su valor anterior, el nuevo, la fecha y el responsable.
<!-- /PROSA -->

<!-- PROSA:promocion.activar.pasos -->
Vuelve a poner una promoción en circulación: desde ese momento puede cobrarse en la venta.
<!-- /PROSA -->

<!-- PROSA:promocion.borrarLogico.pasos -->
Da de baja la promoción. Equivale a desactivarla: se conserva el registro y puede volver a habilitarse.
<!-- /PROSA -->

<!-- PROSA:promocion.create.pasos -->
1. En el menú lateral, abra **Productos** y elija **Promociones**.
2. Presione el botón para crear una promoción.
3. Cargue el **código** con el que se la va a llamar en la venta. Elija algo corto y fácil de tipear.
4. Cargue el **precio promocional**: lo que paga el cliente por el combo completo.
5. Agregue los **productos** que la componen. De cada uno indique la cantidad: **en piezas** si el producto se vende por unidad, **en gramos** si se vende por peso.
6. Elija el **almacén** si la promoción es solo para un punto de venta, o déjelo vacío para que valga en todos.
7. Confirme.

> El código no puede repetirse. Si ya existe una promoción con ese código, el sistema lo avisa; cuando la que lo ocupa está activa, además muestra qué productos la componen, para que pueda comparar antes de decidir.
<!-- /PROSA -->

<!-- PROSA:promocion.desactivar.pasos -->
Retira la promoción de la venta sin borrarla. Deja de poder cobrarse, pero se conserva con todos sus datos y puede reactivarse cuando haga falta —por ejemplo, una promo de temporada.

Su código sigue ocupado mientras la promoción exista, de modo que no puede reutilizarse en una promoción nueva.
<!-- /PROSA -->

<!-- PROSA:promocion.error.el-codigo-pertenece-a-una-promocion-inactiva-por-favor-use-o -->
Ese código lo ocupa una promoción que está desactivada. Como el código se conserva, elija otro para la promoción nueva; o bien vuelva a activar la existente y edítela, si es la misma que quería armar.
<!-- /PROSA -->

<!-- PROSA:promocion.error.el-producto-se-maneja-por-gramos-usar-cantidad-gramos-y-no-c -->
Ese producto se vende **por peso**, así que su cantidad dentro de la promoción tiene que cargarse en **gramos**, no en unidades.
<!-- /PROSA -->

<!-- PROSA:promocion.error.el-producto-se-maneja-por-piezas-usar-cantidad-y-no-cantidad -->
Ese producto se vende **por unidad**, así que su cantidad dentro de la promoción tiene que cargarse en **piezas**, no en gramos.
<!-- /PROSA -->

<!-- PROSA:promocion.error.no-se-encontro-ninguna-promocion-con-el-codigo -->
No existe ninguna promoción con ese código. Revise cómo lo escribió, o consulte la lista de promociones vigentes.  Si la promoción existe pero es de otro almacén, tampoco aparece: solo se puede cobrar en el punto de venta para el que fue creada.
<!-- /PROSA -->

<!-- PROSA:promocion.error.producto-no-encontrado -->
Uno de los productos de la promoción ya no existe en el catálogo. Quítelo de la lista o reemplácelo por el vigente.
<!-- /PROSA -->

<!-- PROSA:promocion.error.productos -->
Ya hay una promoción **activa** con ese código, y el mensaje lista los productos que la integran. Revise si es la que buscaba: si necesita otra distinta, dele un código diferente.
<!-- /PROSA -->

<!-- PROSA:promocion.error.promocion-con-id-no-encontrada -->
La promoción fue eliminada o el enlace es viejo. Vuelva al listado y búsquela de nuevo.
<!-- /PROSA -->

<!-- PROSA:promocion.findAll.pasos -->
Lista todas las promociones, activas y desactivadas, de la más nueva a la más antigua, con su código, su precio y los productos que la componen. Si filtra por almacén, verá las propias de ese punto de venta y las generales.
<!-- /PROSA -->

<!-- PROSA:promocion.findByCodigo.pasos -->
Es la búsqueda que se usa al cobrar: se tipea el código de la promoción y el sistema trae el combo con su precio y sus productos.
<!-- /PROSA -->

<!-- PROSA:promocion.findOne.pasos -->
Abre el detalle de la promoción: código, precio promocional, almacén al que aplica y productos que la componen con sus cantidades.
<!-- /PROSA -->

<!-- PROSA:promocion.getActivas.pasos -->
Deja solo las promociones **vigentes**: las que hoy se pueden cobrar. Es la lista que consulta la pantalla de venta.
<!-- /PROSA -->

<!-- PROSA:promocion.getProductosEnPromocionesActivas.pasos -->
Muestra, producto por producto, en qué promociones vigentes participa y con qué cantidad. Sirve para responder al revés: no "qué tiene esta promo", sino "en qué promos entra este producto".
<!-- /PROSA -->

<!-- PROSA:promocion.proposito -->
Permite vender un conjunto de productos a un precio cerrado, distinto de la suma de sus precios individuales: el combo, la docena, el 2x1.

Cada promoción tiene un **código** con el que se la llama desde la pantalla de venta, un **precio promocional** y la lista de productos que la componen con sus cantidades. Puede ser general —vale en todos los almacenes— o quedar limitada a uno solo.

Al cobrarla, el sistema descuenta del stock cada producto que la integra, en la cantidad que corresponda.
<!-- /PROSA -->

<!-- PROSA:promocion.remove.pasos -->
Borra la promoción de forma **definitiva**. No se puede deshacer.

> Para dejar de usar una promoción, prefiera **desactivarla**: se conserva el registro y puede reactivarse. Reserve el borrado definitivo para promociones cargadas por error.
<!-- /PROSA -->

<!-- PROSA:promocion.update.pasos -->
Cambia el código, el precio, el almacén o los productos de una promoción.

> Si modifica la lista de productos, la anterior se **reemplaza por completo**: cargue todos los que la promoción debe tener, no solo los que agrega.
<!-- /PROSA -->

<!-- PROSA:proveedor.create.pasos -->
1. Presione **Gestionar proveedores**, arriba a la derecha de la pantalla de ingresos de mercadería.
2. Cargue el **nombre** del proveedor y sus datos de contacto.
3. Confirme.

El proveedor queda disponible para elegirlo al registrar un ingreso.
<!-- /PROSA -->

<!-- PROSA:proveedor.error.proveedor-no-encontrado -->
El proveedor fue eliminado o el enlace es viejo. Refresque el listado.
<!-- /PROSA -->

<!-- PROSA:proveedor.getAll.pasos -->
Lista los proveedores dados de alta con sus datos de contacto.
<!-- /PROSA -->

<!-- PROSA:proveedor.getOne.pasos -->
Muestra el detalle de un proveedor.
<!-- /PROSA -->

<!-- PROSA:proveedor.proposito -->
Registra a quiénes les compra el negocio. Cada ingreso de mercadería se imputa a un proveedor, y eso es lo que después permite saber cuánto se le compró a cada uno en un período.
<!-- /PROSA -->

<!-- PROSA:proveedor.remove.pasos -->
Elimina un proveedor. Antes verifique que no tenga ingresos de mercadería registrados, para no perder la referencia de esas compras.
<!-- /PROSA -->

<!-- PROSA:proveedor.update.pasos -->
Corrige los datos de un proveedor: nombre, contacto, teléfono, dirección.
<!-- /PROSA -->

<!-- PROSA:role.create.pasos -->
Da de alta un perfil nuevo. Cargue su **nombre**, que es obligatorio.

El sistema normaliza el nombre según su nomenclatura oficial, y si ya existe un rol equivalente lo devuelve en lugar de crear un duplicado.

> Los tres perfiles estándar ya vienen creados. Crear roles nuevos es una tarea de configuración inicial que conviene coordinar con el equipo que implementó el sistema.
<!-- /PROSA -->

<!-- PROSA:role.error.admin-role-cannot-be-deleted -->
El rol de **Administrador** no se puede eliminar: sin él nadie podría configurar el sistema. Si quiere quitarle el acceso a alguien, sáquele ese rol desde la ficha del usuario.
<!-- /PROSA -->

<!-- PROSA:role.error.invalid-role-sync-secret -->
Falló la sincronización con el sistema externo por un problema de credenciales de la integración. No es un error de operación: avise al equipo técnico.
<!-- /PROSA -->

<!-- PROSA:role.error.role-name-is-required -->
El rol necesita un nombre. Cárguelo antes de confirmar.
<!-- /PROSA -->

<!-- PROSA:role.error.role-not-found -->
El rol fue eliminado o el enlace es viejo. Refresque el listado.
<!-- /PROSA -->

<!-- PROSA:role.getAll.pasos -->
Lista los roles existentes con su nombre y su descripción.
<!-- /PROSA -->

<!-- PROSA:role.getOne.pasos -->
Muestra el detalle de un rol.
<!-- /PROSA -->

<!-- PROSA:role.proposito -->
Define los perfiles de trabajo que existen en el sistema. Un rol agrupa un conjunto de permisos, y a cada usuario se le asignan uno o más.

Los perfiles previstos son **Administrador**, **Vendedor** y **Cocina**.
<!-- /PROSA -->

<!-- PROSA:role.remove.pasos -->
Elimina un rol. Antes de hacerlo, verifique que ningún usuario lo tenga asignado: si lo pierde, esa persona queda sin permisos.
<!-- /PROSA -->

<!-- PROSA:role.sync.pasos -->
Replica el nombre de un rol hacia otro sistema conectado, para que ambos usen la misma nomenclatura.

Es una función técnica de integración: se activa solo si la conexión está configurada en el servidor, y no forma parte de la operación diaria.
<!-- /PROSA -->

<!-- PROSA:role.update.pasos -->
Cambia el nombre o la descripción de un rol.
<!-- /PROSA -->

<!-- PROSA:stock-actual.cancelarInsumo.pasos -->
Revierte un consumo registrado por error. El sistema devuelve la cantidad al stock del almacén de origen y elimina el movimiento.

Solo se pueden cancelar movimientos que sean de tipo insumo. Para revertir una venta o un ingreso de mercadería hay que hacerlo desde su propio módulo.
<!-- /PROSA -->

<!-- PROSA:stock-actual.create.pasos -->
Da de alta la existencia de un producto en un almacén donde todavía no tenía registro. Es un paso excepcional: lo habitual es que el stock se cree solo la primera vez que el producto ingresa por una orden de compra.
<!-- /PROSA -->

<!-- PROSA:stock-actual.error.producto-no-existe -->
El producto fue eliminado o el código es incorrecto. Búsquelo en la lista de productos y verifique que siga dado de alta.
<!-- /PROSA -->

<!-- PROSA:stock-actual.error.stock-no-encontrado-para-producto-en-almacen -->
Ese producto todavía no tiene existencia registrada en este almacén. Regístrele primero una entrada, o ingréselo por una orden de compra.
<!-- /PROSA -->

<!-- PROSA:stock-actual.getAll.pasos -->
1. En el menú lateral, abra **Stock** y elija **Stock**.
2. Use el buscador para filtrar por **nombre, SKU o código de barras**, o acote por **cantidad mínima** y **cantidad máxima** para aislar los productos con poca existencia.
3. **Limpiar filtros** vuelve a mostrar el inventario completo.

Los cuatro indicadores del encabezado —**Productos encontrados**, **Unidades visibles**, **Sin stock visibles** y **Valor visible**— se recalculan según lo que dejen los filtros, no sobre el inventario total. Es la forma rápida de responder "cuánto vale lo que tengo de esta categoría".

Con **Columnas** puede mostrar u ocultar columnas de la tabla, y con **Refrescar** vuelve a pedir los datos al sistema.
<!-- /PROSA -->

<!-- PROSA:stock-actual.getOne.pasos -->
Haga clic en la fila del producto para ver su detalle: existencia actual, precio base, precio final y fecha de la última actualización.
<!-- /PROSA -->

<!-- PROSA:stock-actual.getStockByAlmacen.pasos -->
La pantalla muestra siempre el stock del **almacén activo**, el que figura arriba a la derecha. Si maneja más de un punto de venta, cambie de almacén para ver sus existencias: cada uno lleva su inventario por separado.
<!-- /PROSA -->

<!-- PROSA:stock-actual.proposito -->
Muestra cuánta mercadería hay en este momento en el almacén y cuánto vale. Es la pantalla de consulta del inventario: qué productos están por agotarse, cuáles quedaron en cero y cuál es el valor total de lo que hay en góndola y depósito.

El stock no se carga a mano en el día a día: lo mueve el sistema. Cada venta descuenta, cada ingreso de mercadería suma, y cada ajuste queda registrado como un movimiento con su motivo. Esta pantalla es el resultado de todo eso.
<!-- /PROSA -->

<!-- PROSA:stock-actual.registrarEntrada.pasos -->
Suma mercadería al stock de un producto sin pasar por una orden de compra. Se usa para correcciones de inventario y cargas puntuales.

1. Ubique el producto en la lista y abra el botón de **ajuste** de su fila.
2. Indique la cantidad que ingresa. Si el producto se vende **por peso**, la cantidad se carga en gramos; si se vende por unidad, en piezas.
3. Confirme.

> Toda entrada queda registrada como un movimiento de stock con su fecha y su responsable. Para la mercadería que llega de un proveedor, use **Ingresos Stock**: así el sistema genera además la orden de compra y el gasto correspondiente.
<!-- /PROSA -->

<!-- PROSA:stock-actual.registrarInsumo.pasos -->
Descuenta mercadería que se consume internamente y no se vende: lo que se usa para preparar otro producto, lo que se rompe o lo que se da de baja.

1. Ubique el producto y abra el ajuste de su fila.
2. Elija registrar un **insumo** e indique la cantidad consumida.
3. Confirme. El stock baja y queda asentado el movimiento.

> A diferencia de una venta, un insumo no genera cobro ni impacta en la caja: solo reduce la existencia.
<!-- /PROSA -->

<!-- PROSA:stock-actual.remove.pasos -->
Elimina el registro de stock de un producto en un almacén. Se usa cuando un producto deja de comercializarse en ese punto de venta.
<!-- /PROSA -->

<!-- PROSA:stock-actual.update.pasos -->
Corrige la existencia registrada de un producto, para cuando el conteo físico no coincide con lo que muestra el sistema.

> Use esta opción con criterio: fija el número directamente en lugar de sumar o restar. Si lo que necesita es dejar constancia de por qué cambió la cantidad, conviene registrar una entrada o un insumo, que quedan documentados como movimientos.
<!-- /PROSA -->

<!-- PROSA:unidad.create.pasos -->
Da de alta una unidad nueva con su nombre y su abreviatura. Las habituales ya vienen cargadas; solo hace falta crear alguna si el negocio maneja una medida particular.
<!-- /PROSA -->

<!-- PROSA:unidad.error.unidad-no-encontrada -->
La unidad fue eliminada o el enlace es viejo. Refresque el listado.
<!-- /PROSA -->

<!-- PROSA:unidad.getAll.pasos -->
Lista las unidades de medida cargadas.
<!-- /PROSA -->

<!-- PROSA:unidad.getOne.pasos -->
Muestra el detalle de una unidad.
<!-- /PROSA -->

<!-- PROSA:unidad.proposito -->
Define cómo se mide cada producto: unidades, kilos, litros, paquetes.

Es una decisión con peso operativo: la unidad es la que determina si un producto se vende **por pieza** o **por peso**, y eso cambia cómo se carga en la venta, cómo se cuenta el stock y cómo se cargan los precios de compra.
<!-- /PROSA -->

<!-- PROSA:unidad.remove.pasos -->
Elimina una unidad de medida. Antes verifique que ningún producto la esté usando.
<!-- /PROSA -->

<!-- PROSA:unidad.update.pasos -->
Corrige el nombre o la abreviatura de una unidad.

> ⚠️ Cambiar una unidad afecta a **todos los productos** que la usan, incluida la manera en que se venden y se cuentan. Revise el impacto antes de modificarla.
<!-- /PROSA -->

<!-- PROSA:usuario-rol.create.pasos -->
Otorga un rol a un usuario: elija la persona y el perfil que le corresponde.
<!-- /PROSA -->

<!-- PROSA:usuario-rol.error.usuariorol-no-encontrado -->
La asignación ya fue eliminada. Refresque el listado.
<!-- /PROSA -->

<!-- PROSA:usuario-rol.getAll.pasos -->
Lista todas las asignaciones cargadas: qué usuario tiene qué rol.
<!-- /PROSA -->

<!-- PROSA:usuario-rol.getOne.pasos -->
Muestra el detalle de una asignación.
<!-- /PROSA -->

<!-- PROSA:usuario-rol.proposito -->
Es el vínculo entre una persona y un perfil: registra qué roles tiene asignados cada usuario. Un usuario puede tener más de uno y suma los permisos de todos.

En el uso normal esta asignación se hace desde la ficha del usuario; esta sección es la vista detallada de esos vínculos.
<!-- /PROSA -->

<!-- PROSA:usuario-rol.remove.pasos -->
Le quita un rol a un usuario. Si era el único que tenía, la persona sigue pudiendo entrar pero queda sin permisos.
<!-- /PROSA -->

<!-- PROSA:usuario-rol.update.pasos -->
Cambia el usuario o el rol de una asignación existente.
<!-- /PROSA -->

<!-- PROSA:usuario.activar.pasos -->
Vuelve a habilitar una cuenta dada de baja, con sus roles y su historial intactos.
<!-- /PROSA -->

<!-- PROSA:usuario.create.pasos -->
1. Entre a **Gestión → Usuarios** y presione el botón para crear un usuario.
2. Cargue el **nombre** de la persona, su **email** y el **nombre de usuario** con el que va a ingresar.
3. Defina una **contraseña** inicial.
4. Confirme. El usuario queda **activo**.
5. Asígnele los **roles** que correspondan editándolo: sin rol asignado, el usuario entra pero no tiene permisos.

> Entregue la contraseña inicial en persona y pida que la cambie en el primer ingreso. El sistema guarda las contraseñas cifradas: nadie, ni el administrador, puede verlas después.
<!-- /PROSA -->

<!-- PROSA:usuario.desactivar.pasos -->
Da de baja al usuario: deja de poder entrar al sistema de inmediato. La cuenta no se borra, y todo lo que registró se conserva con su nombre.

Es lo que hay que hacer cuando alguien deja de trabajar en el negocio.
<!-- /PROSA -->

<!-- PROSA:usuario.error.el-nombre-de-usuario-ya-esta-en-uso -->
Otra persona ya usa ese nombre de usuario. Elija uno distinto.
<!-- /PROSA -->

<!-- PROSA:usuario.error.el-rol-con-id-no-existe -->
Uno de los roles que intentó asignar ya no existe. Refresque la pantalla y vuelva a elegir de la lista.
<!-- /PROSA -->

<!-- PROSA:usuario.getAll.pasos -->
1. En el menú lateral, abra **Gestión** y elija **Usuarios**.
2. La lista muestra los usuarios **activos**. Puede pedir ver también los dados de baja, o todos juntos.

De cada uno figuran su nombre, su email, su nombre de usuario y los roles que tiene asignados.
<!-- /PROSA -->

<!-- PROSA:usuario.getOne.pasos -->
Haga clic en la fila para ver el detalle del usuario y los roles que tiene.
<!-- /PROSA -->

<!-- PROSA:usuario.proposito -->
Administra las cuentas de las personas que usan el sistema: quién puede entrar y qué puede hacer.

Cada usuario tiene su nombre, su email, su nombre de usuario y uno o más **roles**, que determinan a qué partes del sistema accede.
<!-- /PROSA -->

<!-- PROSA:usuario.remove.pasos -->
Equivale a dar de baja al usuario: la cuenta se desactiva pero **no se elimina**, de modo que se mantiene la trazabilidad de las operaciones que registró.
<!-- /PROSA -->

<!-- PROSA:usuario.update.pasos -->
Corrige el nombre, el email o el nombre de usuario, cambia la contraseña y modifica los roles asignados.

Sobre la contraseña: si deja el campo vacío, la actual se mantiene. Cargue algo solo cuando quiera reemplazarla.

Sobre los roles: la lista que envíe **reemplaza por completo** a la anterior. Marque todos los que la persona debe tener, no solo los que agrega.
<!-- /PROSA -->

<!-- PROSA:venta.actualizarEstado.pasos -->
Cambia el estado de una venta ya registrada. Se usa para marcar el avance de una operación que no se completa en el mostrador.
<!-- /PROSA -->

<!-- PROSA:venta.create.pasos -->
1. Escanee el código de barras del producto o escriba su nombre en el buscador del encabezado. El producto se agrega al **Carrito actual** y el **Total a cobrar** se actualiza solo.
2. Repita con todos los productos. Los que se venden **por peso** se cargan en gramos; los demás, por unidad.
3. Si corresponde una promoción, presione **Cargar promoción** y elíjala de la lista.
4. Si el artículo no está dado de alta, use **Producto no registrado** para cobrarlo indicando el importe a mano.
5. Si el cliente compra a crédito, presione **Usar cuenta** en el bloque **Cuenta corriente** y busque su cuenta.
6. Aplique descuentos o recargos con **Ajustes**, o use el botón **Empleado -10%** para el descuento de personal.
7. Elija el **método de pago** entre Efectivo, Transferencia, QR, Débito, Crédito y UCC. Para cobrar en varios medios, cargue el primero con su importe, presione **+** y agregue el siguiente; el bloque inferior le muestra en todo momento **Total final**, **Pagado**, **Restante** y **Vuelto**.
8. Cierre la operación con **Completar Venta**, o con **Completar Venta + Ticket** si el cliente lleva comprobante impreso.

> La suma de los pagos debe coincidir exactamente con el total de la venta. La única excepción son las ventas a cuenta corriente, donde el cliente puede entregar un pago inicial menor al total y el resto queda como deuda.

> Si se equivocó antes de cobrar, **Limpiar venta** vacía el carrito. Si ya cobró y necesita reimprimir, use **Reimprimir último ticket**.
<!-- /PROSA -->

<!-- PROSA:venta.error.almacen-no-encontrado -->
El almacén seleccionado no existe o fue dado de baja. Verifique el almacén activo que figura arriba a la derecha.
<!-- /PROSA -->

<!-- PROSA:venta.error.cuentacorrienteid-es-obligatorio-para-ventas-a-cuenta-corrie -->
Eligió cobrar a cuenta corriente pero no indicó de qué cliente. Presione **Usar cuenta** y seleccione la cuenta antes de confirmar.
<!-- /PROSA -->

<!-- PROSA:venta.error.cuentacorrienteid-solo-puede-enviarse-con-tipocobro-cuenta-c -->
Se asoció una cuenta corriente a una venta de contado. Quite la cuenta, o cambie la forma de cobro a cuenta corriente.
<!-- /PROSA -->

<!-- PROSA:venta.error.id-invalido -->
El identificador de la venta no es un número válido. Vuelva al historial y abra la venta desde la lista.
<!-- /PROSA -->

<!-- PROSA:venta.error.la-venta-debe-incluir-al-menos-un-item-o-una-promocion -->
Intentó cobrar con el carrito vacío. Cargue al menos un producto o una promoción antes de confirmar.
<!-- /PROSA -->

<!-- PROSA:venta.error.venta-con-id-no-encontrada -->
La venta no existe o fue eliminada. Refresque el historial.
<!-- /PROSA -->

<!-- PROSA:venta.error.venta-with-id-not-found -->
La venta no existe o fue eliminada. Refresque el historial.
<!-- /PROSA -->

<!-- PROSA:venta.findOne.pasos -->
Desde el historial de ventas, haga clic en la fila de la venta. Se abre el detalle con los productos vendidos, las cantidades, los importes y la forma de pago.
<!-- /PROSA -->

<!-- PROSA:venta.getVentaCompleta.pasos -->
Es la vista ampliada de una venta. Además de los productos y los importes, muestra los **ajustes aplicados** (cada descuento o recargo con su motivo y el usuario que lo autorizó), los **pagos** discriminados por medio, y la cuenta corriente asociada si la hubiera. Es la vista que conviene usar cuando hay que auditar una operación puntual.
<!-- /PROSA -->

<!-- PROSA:venta.obtenerEstadisticas.pasos -->
1. Vaya a **Gestión → Métricas**.
2. Seleccione el período que quiere analizar.

La pantalla resume el desempeño del período: cantidad de ventas, importe total facturado, ticket promedio y la distribución por método de pago. Sirve para comparar jornadas o cerrar el mes.
<!-- /PROSA -->

<!-- PROSA:venta.obtenerTotalPorCategoria.pasos -->
Dentro de **Métricas**, este corte agrupa lo vendido por **categoría de producto** en el período elegido. Permite ver qué rubros concentran la facturación y detectar caídas de una categoría puntual.
<!-- /PROSA -->

<!-- PROSA:venta.obtenerVentas.pasos -->
1. Vaya a **Gestión → Historial de ventas**.
2. Acote la búsqueda con los filtros disponibles: rango de fechas, almacén, método de pago o usuario que registró la venta.
3. La lista muestra cada venta con su fecha, total y forma de cobro. Haga clic en una fila para ver el detalle completo.

Los totales que se muestran arriba corresponden al resultado filtrado, no a la totalidad de las ventas: si cambia los filtros, los importes se recalculan.
<!-- /PROSA -->

<!-- PROSA:venta.proposito -->
Es la pantalla donde se cobra. Concentra todo el mostrador: se cargan los productos con el lector de código de barras o buscándolos por nombre, se aplican promociones y descuentos, se elige cómo paga el cliente y se cierra la operación con o sin ticket impreso.

Al confirmar una venta, el sistema descuenta el stock de cada producto del almacén en el que está trabajando, registra el cobro en la caja abierta e imputa la deuda si el cliente compra a cuenta corriente. Todo eso ocurre en un solo paso: si algo falla —por ejemplo, si un producto quedó sin stock suficiente— no se registra nada y la venta queda sin efecto.
<!-- /PROSA -->

<!-- PROSA:venta.tipocobroventa.contado -->
El cliente paga la totalidad en el momento. La venta queda saldada.
<!-- /PROSA -->

<!-- PROSA:venta.tipocobroventa.cuenta-corriente -->
El cliente se lleva la mercadería y la deuda se imputa a su cuenta. Puede entregar un pago inicial parcial; el resto queda como saldo pendiente.
<!-- /PROSA -->

<!-- PROSA:venta.ventaajustemodo.monto -->
El valor cargado se descuenta o se suma como un importe fijo en pesos, sin importar el subtotal.
<!-- /PROSA -->

<!-- PROSA:venta.ventaajustemodo.porcentaje -->
El valor cargado se interpreta como un porcentaje del subtotal. Un descuento porcentual no puede superar el 100%.
<!-- /PROSA -->

<!-- PROSA:venta.ventaajusteorigen.manual -->
Lo cargó el vendedor durante la venta, indicando el motivo. Queda registrado a su nombre.
<!-- /PROSA -->

<!-- PROSA:venta.ventaajusteorigen.medio-pago -->
Lo aplicó el sistema por el medio de pago elegido, como un recargo por tarjeta.
<!-- /PROSA -->

<!-- PROSA:venta.ventaajusteorigen.regla -->
Lo aplicó el sistema por una regla comercial configurada, como el descuento de empleado.
<!-- /PROSA -->

<!-- PROSA:venta.ventaajustetipo.descuento -->
Resta dinero del total de la venta.
<!-- /PROSA -->

<!-- PROSA:venta.ventaajustetipo.recargo -->
Suma dinero al total de la venta, por ejemplo un interés por financiación.
<!-- /PROSA -->
