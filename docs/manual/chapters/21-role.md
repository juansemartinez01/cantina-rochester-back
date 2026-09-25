## 21. Roles

### 21.1 Para qué sirve

<!-- PROSA:role.proposito -->
Define los perfiles de trabajo que existen en el sistema. Un rol agrupa un conjunto de permisos, y a cada usuario se le asignan uno o más.

Los perfiles previstos son **Administrador**, **Vendedor** y **Cocina**.
<!-- /PROSA -->


### 21.2 Cómo llegar

<!-- PROSA:role.navegacion -->
> _Pendiente de redacción — completar con la ruta de menú real de la aplicación_
<!-- /PROSA -->


### 21.3 Acciones disponibles


#### 21.3.1 Sync

<!-- PROSA:role.sync.pasos -->
Replica el nombre de un rol hacia otro sistema conectado, para que ambos usen la misma nomenclatura.

Es una función técnica de integración: se activa solo si la conexión está configurada en el servidor, y no forma parte de la operación diaria.
<!-- /PROSA -->


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| Invalid role sync secret | <!-- PROSA:role.error.invalid-role-sync-secret --> Falló la sincronización con el sistema externo por un problema de credenciales de la integración. No es un error de operación: avise al equipo técnico. <!-- /PROSA --> |


#### 21.3.2 Get all

<!-- PROSA:role.getAll.pasos -->
Lista los roles existentes con su nombre y su descripción.
<!-- /PROSA -->


#### 21.3.3 Get one

<!-- PROSA:role.getOne.pasos -->
Muestra el detalle de un rol.
<!-- /PROSA -->


#### 21.3.4 Create

<!-- PROSA:role.create.pasos -->
Da de alta un perfil nuevo. Cargue su **nombre**, que es obligatorio.

El sistema normaliza el nombre según su nomenclatura oficial, y si ya existe un rol equivalente lo devuelve en lugar de crear un duplicado.

> Los tres perfiles estándar ya vienen creados. Crear roles nuevos es una tarea de configuración inicial que conviene coordinar con el equipo que implementó el sistema.
<!-- /PROSA -->


**Datos a completar**

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `nombre` | Texto | **Sí** | Máx. 100 caracteres |


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| Role name is required | <!-- PROSA:role.error.role-name-is-required --> El rol necesita un nombre. Cárguelo antes de confirmar. <!-- /PROSA --> |


#### 21.3.5 Update

<!-- PROSA:role.update.pasos -->
Cambia el nombre o la descripción de un rol.
<!-- /PROSA -->


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| Role name is required | <!-- PROSA:role.error.role-name-is-required --> El rol necesita un nombre. Cárguelo antes de confirmar. <!-- /PROSA --> |


#### 21.3.6 Remove

<!-- PROSA:role.remove.pasos -->
Elimina un rol. Antes de hacerlo, verifique que ningún usuario lo tenga asignado: si lo pierde, esa persona queda sin permisos.
<!-- /PROSA -->


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| Admin role cannot be deleted | <!-- PROSA:role.error.admin-role-cannot-be-deleted --> El rol de **Administrador** no se puede eliminar: sin él nadie podría configurar el sistema. Si quiere quitarle el acceso a alguien, sáquele ese rol desde la ficha del usuario. <!-- /PROSA --> |
| Role {id} not found | <!-- PROSA:role.error.role-not-found --> El rol fue eliminado o el enlace es viejo. Refresque el listado. <!-- /PROSA --> |


### 21.5 Otras validaciones del módulo

| Mensaje | Se produce en |
| --- | --- |
| {         message: 'Role sync failed',         peerStatus: res.status,         peerBody: body.slice(0, 500),       } | Sync role name |
| Role {id} not found | Find one |
