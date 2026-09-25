## 16. Extracciones de caja

### 16.1 Para qué sirve

Retiro de dinero de la caja.

<!-- PROSA:extraccion.proposito -->
Registra el dinero que se saca del circuito de ventas: los retiros de efectivo y las transferencias hacia las cuentas del negocio.

El sistema lleva el **disponible** por vía, separando el efectivo del dinero bancarizado. El disponible de cada vía es lo cobrado por ella menos lo que ya se retiró.
<!-- /PROSA -->


### 16.2 Cómo llegar

<!-- PROSA:extraccion.navegacion -->
> _Pendiente de redacción — completar con la ruta de menú real de la aplicación_
<!-- /PROSA -->


### 16.3 Acciones disponibles


#### 16.3.1 Crear

<!-- PROSA:extraccion.crear.pasos -->
1. Elija el **origen** del retiro: **efectivo** o **bancarizado**.
2. Cargue el **monto**.
3. Escriba el **motivo**: a dónde va ese dinero (depósito bancario, pago a proveedor, retiro de socios).
4. Confirme.

El monto no puede superar el disponible de esa vía.
<!-- /PROSA -->


**Datos a completar**

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `origen` | Opción de lista | **Sí** | — |
| `monto` | Número | **Sí** | Mínimo 0.01 |
| `motivo` | string | **Sí** | Máx. 500 caracteres |


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| Fondos insuficientes en {dto.origen}. Total disponible: ${totalDisponible.toFixed(2)} | <!-- PROSA:extraccion.error.fondos-insuficientes-en-total-disponible --> Está intentando retirar más de lo que hay disponible en esa vía; el mensaje indica el tope. Revise el monto, o verifique si el retiro corresponde a la otra vía. <!-- /PROSA --> |


#### 16.3.2 Get extracciones con filtros

<!-- PROSA:extraccion.getExtraccionesConFiltros.pasos -->
Lista los retiros registrados, de los más recientes a los más antiguos. Puede acotar por **origen** y por **rango de fechas**, y ordenar por fecha u origen.
<!-- /PROSA -->


**Filtros disponibles**

| Filtro | Tipo | Obligatorio | Observación |
| --- | --- | --- | --- |
| `origen` | string | No | — |
| `fechaDesde` | string | No | — |
| `fechaHasta` | string | No | — |
| `page` | string | No | Por defecto: `1` |
| `limit` | string | No | Por defecto: `50` |
| `ordenCampo` | string | No | Por defecto: `fecha` |
| `ordenDireccion` | 'ASC' \| 'DESC' | No | Por defecto: `DESC` |


#### 16.3.3 Obtener totales

<!-- PROSA:extraccion.obtenerTotales.pasos -->
Muestra cuánto queda disponible para retirar en cada vía —**efectivo** y **bancarizado**—, calculado como el total cobrado por esa vía menos lo ya extraído.
<!-- /PROSA -->


#### 16.3.4 Editar

<!-- PROSA:extraccion.editar.pasos -->
Corrige un retiro ya registrado: su origen, su monto o su motivo. Si cambia el monto o la vía, el sistema vuelve a verificar que haya fondos suficientes, sin contar la extracción que está editando.
<!-- /PROSA -->


**Datos a completar**

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `origen` | Opción de lista | No | — |
| `monto` | Número | No | Mínimo 0.01 |
| `motivo` | string | No | Máx. 500 caracteres |


#### 16.3.5 Borrar

<!-- PROSA:extraccion.borrar.pasos -->
Elimina un retiro cargado por error. El monto vuelve a quedar disponible en su vía.
<!-- /PROSA -->


### 16.5 Otras validaciones del módulo

| Mensaje | Se produce en |
| --- | --- |
| Extracción {id} no encontrada | Borrar extraccion |
| Extracción {id} no encontrada | Editar extraccion |
| Fondos insuficientes en {nuevoOrigen}. Disponible: ${disponible.toFixed(2)} | Editar extraccion |
