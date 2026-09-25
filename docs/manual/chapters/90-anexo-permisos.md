## Anexo A. Perfiles y permisos

**Admin** — Acceso total. Configura el sistema, gestiona usuarios, ve reportes y cierra cajas.

**Vendedor** — Opera el día a día: registra ventas, cobra, abre y cierra su caja.

**Cocina** — Visualiza los pedidos a preparar y marca su avance.


> ⚠️ **Nota técnica para el equipo (quitar del entregable al cliente):** el backend exige inicio de sesión en todos los endpoints, pero **no restringe por rol**: no hay ningún `@Roles()` aplicado. La tabla siguiente describe el comportamiento *previsto*, no el que el sistema aplica hoy.


| Módulo | Acciones | Admin | Vendedor | Cocina |
| --- | --- | --- | --- | --- |
| Almacenes | 5 | — | — | — |
| Acceso al sistema | 3 | — | — | — |
| Caja | 8 | — | — | — |
| Categorías | 5 | — | — | — |
| Cuentas corrientes | 10 | — | — | — |
| Extracciones de caja | 5 | — | — | — |
| Facturación | 1 | — | — | — |
| Gastos | 11 | — | — | — |
| Ingresos | 3 | — | — | — |
| Movimientos de stock | 6 | — | — | — |
| Órdenes de compra | 5 | — | — | — |
| Parámetros de reposición | 5 | — | — | — |
| Productos | 14 | — | — | — |
| Promociones | 11 | — | — | — |
| Proveedores | 5 | — | — | — |
| Roles | 6 | — | — | — |
| Stock | 9 | — | — | — |
| Unidades de medida | 5 | — | — | — |
| Usuarios | 7 | — | — | — |
| Asignación de roles | 5 | — | — | — |
| Ventas | 7 | — | — | — |


> Completar la matriz con ✔ / ✖ según la política de acceso definida con el cliente.
