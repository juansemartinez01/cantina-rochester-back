## 13. Unidades de medida

### 13.1 Para qué sirve

<!-- PROSA:unidad.proposito -->
Define cómo se mide cada producto: unidades, kilos, litros, paquetes.

Es una decisión con peso operativo: la unidad es la que determina si un producto se vende **por pieza** o **por peso**, y eso cambia cómo se carga en la venta, cómo se cuenta el stock y cómo se cargan los precios de compra.
<!-- /PROSA -->


### 13.2 Cómo llegar

<!-- PROSA:unidad.navegacion -->
> _Pendiente de redacción — completar con la ruta de menú real de la aplicación_
<!-- /PROSA -->


### 13.3 Acciones disponibles


#### 13.3.1 Get all

<!-- PROSA:unidad.getAll.pasos -->
Lista las unidades de medida cargadas.
<!-- /PROSA -->


#### 13.3.2 Get one

<!-- PROSA:unidad.getOne.pasos -->
Muestra el detalle de una unidad.
<!-- /PROSA -->


#### 13.3.3 Create

<!-- PROSA:unidad.create.pasos -->
Da de alta una unidad nueva con su nombre y su abreviatura. Las habituales ya vienen cargadas; solo hace falta crear alguna si el negocio maneja una medida particular.
<!-- /PROSA -->


**Datos a completar**

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `nombre` | Texto | **Sí** | Máx. 50 caracteres |
| `abreviatura` | Texto | No | Máx. 20 caracteres |


#### 13.3.4 Update

<!-- PROSA:unidad.update.pasos -->
Corrige el nombre o la abreviatura de una unidad.

> ⚠️ Cambiar una unidad afecta a **todos los productos** que la usan, incluida la manera en que se venden y se cuentan. Revise el impacto antes de modificarla.
<!-- /PROSA -->


#### 13.3.5 Remove

<!-- PROSA:unidad.remove.pasos -->
Elimina una unidad de medida. Antes verifique que ningún producto la esté usando.
<!-- /PROSA -->


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| Unidad {id} no encontrada | <!-- PROSA:unidad.error.unidad-no-encontrada --> La unidad fue eliminada o el enlace es viejo. Refresque el listado. <!-- /PROSA --> |


### 13.5 Otras validaciones del módulo

| Mensaje | Se produce en |
| --- | --- |
| Unidad {id} no encontrada | Find one |
