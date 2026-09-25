## 20. Asignación de roles

### 20.1 Para qué sirve

<!-- PROSA:usuario-rol.proposito -->
Es el vínculo entre una persona y un perfil: registra qué roles tiene asignados cada usuario. Un usuario puede tener más de uno y suma los permisos de todos.

En el uso normal esta asignación se hace desde la ficha del usuario; esta sección es la vista detallada de esos vínculos.
<!-- /PROSA -->


### 20.2 Cómo llegar

<!-- PROSA:usuario-rol.navegacion -->
> _Pendiente de redacción — completar con la ruta de menú real de la aplicación_
<!-- /PROSA -->


### 20.3 Acciones disponibles


#### 20.3.1 Get all

<!-- PROSA:usuario-rol.getAll.pasos -->
Lista todas las asignaciones cargadas: qué usuario tiene qué rol.
<!-- /PROSA -->


#### 20.3.2 Get one

<!-- PROSA:usuario-rol.getOne.pasos -->
Muestra el detalle de una asignación.
<!-- /PROSA -->


#### 20.3.3 Create

<!-- PROSA:usuario-rol.create.pasos -->
Otorga un rol a un usuario: elija la persona y el perfil que le corresponde.
<!-- /PROSA -->


**Datos a completar**

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `usuarioId` | Número entero | **Sí** | — |
| `rolId` | Número entero | **Sí** | — |


#### 20.3.4 Update

<!-- PROSA:usuario-rol.update.pasos -->
Cambia el usuario o el rol de una asignación existente.
<!-- /PROSA -->


#### 20.3.5 Remove

<!-- PROSA:usuario-rol.remove.pasos -->
Le quita un rol a un usuario. Si era el único que tenía, la persona sigue pudiendo entrar pero queda sin permisos.
<!-- /PROSA -->


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| UsuarioRol {id} no encontrado | <!-- PROSA:usuario-rol.error.usuariorol-no-encontrado --> La asignación ya fue eliminada. Refresque el listado. <!-- /PROSA --> |


### 20.5 Otras validaciones del módulo

| Mensaje | Se produce en |
| --- | --- |
| UsuarioRol {id} no encontrado | Find one |
