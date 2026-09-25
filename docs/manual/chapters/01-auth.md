## 1. Acceso al sistema

### 1.1 Para qué sirve

<!-- PROSA:auth.proposito -->
Controla quién entra al sistema. Cada persona tiene su usuario y su contraseña, y el sistema registra bajo ese nombre todo lo que hace: las ventas que cobra, los movimientos de caja, los ajustes de stock.

Por eso las credenciales son personales y no deben compartirse: la trazabilidad de las operaciones depende de que cada uno trabaje con su propia cuenta.
<!-- /PROSA -->


### 1.2 Cómo llegar

<!-- PROSA:auth.navegacion -->
> _Pendiente de redacción — completar con la ruta de menú real de la aplicación_
<!-- /PROSA -->


### 1.3 Acciones disponibles


#### 1.3.1 Login

<!-- PROSA:auth.login.pasos -->
1. Abra la dirección del sistema en el navegador.
2. Cargue su **dirección de email** y su **contraseña**.
3. Presione **Iniciar Sesión**.
4. Elija el **espacio de trabajo** con el que va a operar.

Si los datos son correctos, entra a la pantalla de inicio. La sesión queda abierta mientras trabaje y vence después de un tiempo de inactividad: en ese caso vuelva a iniciar sesión.

> Si el sistema rechaza el ingreso, revise que el email esté bien escrito y que la tecla de mayúsculas no esté activada. Si el usuario fue dado de baja, tampoco puede entrar, aunque la contraseña sea correcta: pida al administrador que lo reactive.
<!-- /PROSA -->


**Datos a completar**

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `email` | Correo electrónico | **Sí** | Máx. 100 caracteres |
| `password` | Texto | **Sí** | — |


#### 1.3.2 Get profile

<!-- PROSA:auth.getProfile.pasos -->
Muestra el perfil del usuario conectado, con sus datos personales y sus permisos.
<!-- /PROSA -->


#### 1.3.3 Me

<!-- PROSA:auth.me.pasos -->
Muestra los datos de la sesión abierta: nombre, usuario y roles asignados. Es la forma de confirmar con qué cuenta está trabajando.
<!-- /PROSA -->


### 1.4 Estados y opciones


**Jwt constants**

| Valor | Significado |
| --- | --- |
| `process.env.JWT_SECRET \|\| 'defaultSecret'` | <!-- PROSA:auth.jwtconstants.process-env-jwt-secret-defaultsecret --> Clave interna con la que el sistema firma las sesiones. Es un parámetro técnico del servidor: no se configura desde la aplicación ni el usuario interviene en él. <!-- /PROSA --> |


**App roles**

| Valor | Significado |
| --- | --- |
| `Admin` | <!-- PROSA:auth.app-roles.admin --> **Administrador.** Acceso total: configura el sistema, gestiona usuarios y precios, ve los reportes y cierra cajas. <!-- /PROSA --> |
| `Vendedor` | <!-- PROSA:auth.app-roles.vendedor --> **Vendedor.** Opera el día a día: registra ventas, cobra, y abre y cierra su caja. <!-- /PROSA --> |
| `Cocina` | <!-- PROSA:auth.app-roles.cocina --> **Cocina.** Ve los pedidos que hay que preparar y marca su avance. <!-- /PROSA --> |


**Legacy role name map**

| Valor | Significado |
| --- | --- |
| `APP_ROLES.ADMIN` | <!-- PROSA:auth.legacy-role-name-map.app-roles-admin --> Nombres antiguos que el sistema sigue reconociendo y traduce a **Administrador**: `admin`, `administrador` y `supervisor`. Es para que las cuentas cargadas con la nomenclatura vieja mantengan sus permisos. <!-- /PROSA --> |
| `APP_ROLES.ADMIN` | <!-- PROSA:auth.legacy-role-name-map.app-roles-admin --> Nombres antiguos que el sistema sigue reconociendo y traduce a **Administrador**: `admin`, `administrador` y `supervisor`. Es para que las cuentas cargadas con la nomenclatura vieja mantengan sus permisos. <!-- /PROSA --> |
| `APP_ROLES.ADMIN` | <!-- PROSA:auth.legacy-role-name-map.app-roles-admin --> Nombres antiguos que el sistema sigue reconociendo y traduce a **Administrador**: `admin`, `administrador` y `supervisor`. Es para que las cuentas cargadas con la nomenclatura vieja mantengan sus permisos. <!-- /PROSA --> |
| `APP_ROLES.VENDEDOR` | <!-- PROSA:auth.legacy-role-name-map.app-roles-vendedor --> Nombres antiguos que el sistema traduce a **Vendedor**: `vendedor` y `operador_caja`. <!-- /PROSA --> |
| `APP_ROLES.VENDEDOR` | <!-- PROSA:auth.legacy-role-name-map.app-roles-vendedor --> Nombres antiguos que el sistema traduce a **Vendedor**: `vendedor` y `operador_caja`. <!-- /PROSA --> |
| `APP_ROLES.COCINA` | <!-- PROSA:auth.legacy-role-name-map.app-roles-cocina --> Nombre antiguo que el sistema traduce a **Cocina**: `cocina`. <!-- /PROSA --> |


### 1.5 Otras validaciones del módulo

| Mensaje | Se produce en |
| --- | --- |
| Token invalido | Verify token |
