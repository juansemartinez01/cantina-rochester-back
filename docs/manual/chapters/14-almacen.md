## 14. Almacenes

### 14.1 Para qué sirve

Sucursal o punto de venta. Cada almacén tiene su propio stock, caja y precios.

<!-- PROSA:almacen.proposito -->
Define los puntos de venta del negocio. Cada almacén lleva **su propio stock, su propia caja y sus propios precios**: la misma mercadería puede tener existencias y precios distintos en cada uno.

El almacén activo se elige al entrar y figura en la pantalla; todo lo que registre —ventas, movimientos, cobros— se imputa a ese punto de venta.
<!-- /PROSA -->


### 14.2 Cómo llegar

<!-- PROSA:almacen.navegacion -->
> _Pendiente de redacción — completar con la ruta de menú real de la aplicación_
<!-- /PROSA -->


### 14.3 Acciones disponibles


#### 14.3.1 Get all

<!-- PROSA:almacen.getAll.pasos -->
Lista los almacenes dados de alta, con su nombre y su ubicación.
<!-- /PROSA -->


#### 14.3.2 Get one

<!-- PROSA:almacen.getOne.pasos -->
Muestra el detalle de un almacén.
<!-- /PROSA -->


#### 14.3.3 Create

<!-- PROSA:almacen.create.pasos -->
Da de alta un punto de venta nuevo: cargue su **nombre** y su **ubicación**.

El almacén nace sin stock y sin precios propios; los productos se venden allí al precio base hasta que se le cargue un precio propio.

> Abrir un almacén es una decisión de configuración con impacto en toda la operación. Conviene coordinarlo con el equipo que implementó el sistema.
<!-- /PROSA -->


**Datos a completar**

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `nombre` | Texto | **Sí** | Máx. 100 caracteres |
| `ubicacion` | Texto | No | Máx. 255 caracteres |
| `capacidad` | Número entero | No | Mínimo 0 |


#### 14.3.4 Update

<!-- PROSA:almacen.update.pasos -->
Corrige el nombre o la ubicación de un almacén.
<!-- /PROSA -->


#### 14.3.5 Remove

<!-- PROSA:almacen.remove.pasos -->
Elimina un almacén.

> ⚠️ Un almacén concentra stock, cajas, precios y ventas. No lo elimine si tuvo operación: consulte antes con el equipo técnico.
<!-- /PROSA -->


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| Almacén {id} no encontrado | <!-- PROSA:almacen.error.almacen-no-encontrado --> El almacén fue eliminado o el enlace es viejo. Refresque el listado. <!-- /PROSA --> |


### 14.5 Otras validaciones del módulo

| Mensaje | Se produce en |
| --- | --- |
| Almacén {id} no encontrado | Find one |
