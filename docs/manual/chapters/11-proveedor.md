## 11. Proveedores

### 11.1 Para qué sirve

<!-- PROSA:proveedor.proposito -->
Registra a quiénes les compra el negocio. Cada ingreso de mercadería se imputa a un proveedor, y eso es lo que después permite saber cuánto se le compró a cada uno en un período.
<!-- /PROSA -->


### 11.2 Cómo llegar

En el menú lateral, abra **Stock** y elija **Ingresos Stock → Gestionar proveedores**.


La pantalla se titula *Proveedores*.


Se accede desde el botón **Gestionar proveedores**, arriba a la derecha de la pantalla de ingresos de mercadería. El mismo botón está disponible en la pantalla de Stock.


![Pantalla Proveedores](../capturas/proveedor-pantalla.png)


### 11.3 Acciones disponibles


#### 11.3.1 Get all

<!-- PROSA:proveedor.getAll.pasos -->
Lista los proveedores dados de alta con sus datos de contacto.
<!-- /PROSA -->


#### 11.3.2 Get one

<!-- PROSA:proveedor.getOne.pasos -->
Muestra el detalle de un proveedor.
<!-- /PROSA -->


#### 11.3.3 Create

<!-- PROSA:proveedor.create.pasos -->
1. Presione **Gestionar proveedores**, arriba a la derecha de la pantalla de ingresos de mercadería.
2. Cargue el **nombre** del proveedor y sus datos de contacto.
3. Confirme.

El proveedor queda disponible para elegirlo al registrar un ingreso.
<!-- /PROSA -->


**Datos a completar**

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `nombre` | Texto | **Sí** | Máx. 255 caracteres |
| `contacto` | Texto | No | Máx. 255 caracteres |
| `telefono` | Texto | No | Máx. 50 caracteres |
| `email` | Correo electrónico | No | Máx. 100 caracteres |


#### 11.3.4 Update

<!-- PROSA:proveedor.update.pasos -->
Corrige los datos de un proveedor: nombre, contacto, teléfono, dirección.
<!-- /PROSA -->


#### 11.3.5 Remove

<!-- PROSA:proveedor.remove.pasos -->
Elimina un proveedor. Antes verifique que no tenga ingresos de mercadería registrados, para no perder la referencia de esas compras.
<!-- /PROSA -->


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| Proveedor {id} no encontrado | <!-- PROSA:proveedor.error.proveedor-no-encontrado --> El proveedor fue eliminado o el enlace es viejo. Refresque el listado. <!-- /PROSA --> |


### 11.5 Otras validaciones del módulo

| Mensaje | Se produce en |
| --- | --- |
| Proveedor {id} no encontrado | Find one |
