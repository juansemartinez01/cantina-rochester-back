## 15. Parámetros de reposición

### 15.1 Para qué sirve

Stock mínimo a partir del cual el sistema avisa que hay que reponer.

<!-- PROSA:parametro-reorden.proposito -->
Define, para cada producto, a partir de qué existencia hay que reponer y hasta cuánto conviene comprar.

Se cargan dos números:

- **Nivel mínimo**: el punto de alerta. Cuando el stock llega ahí, hay que reponer.
- **Nivel óptimo**: la existencia a la que conviene volver al comprar.

Es lo que convierte el control de stock en una tarea previsible: en lugar de mirar el depósito, se mira qué productos cayeron por debajo de su mínimo.
<!-- /PROSA -->


### 15.2 Cómo llegar

<!-- PROSA:parametro-reorden.navegacion -->
> _Pendiente de redacción — completar con la ruta de menú real de la aplicación_
<!-- /PROSA -->


### 15.3 Acciones disponibles


#### 15.3.1 Get all

<!-- PROSA:parametro-reorden.getAll.pasos -->
Lista los productos que tienen parámetros cargados, con su nivel mínimo y su nivel óptimo.
<!-- /PROSA -->


#### 15.3.2 Get one

<!-- PROSA:parametro-reorden.getOne.pasos -->
Muestra los parámetros de reposición de un producto.
<!-- /PROSA -->


#### 15.3.3 Create

<!-- PROSA:parametro-reorden.create.pasos -->
1. Elija el **producto**.
2. Cargue el **nivel mínimo** y el **nivel óptimo**. El óptimo tiene que ser mayor o igual que el mínimo.
3. Confirme.

Las cantidades se expresan en la unidad del producto: en piezas si se vende por unidad, en gramos si se vende por peso.

> Un criterio práctico para el mínimo: lo que se vende en el tiempo que tarda el proveedor en entregar, más un margen. Para el óptimo, lo que se vende entre dos pedidos.
<!-- /PROSA -->


**Datos a completar**

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `producto_id` | Número entero | **Sí** | — |
| `nivel_minimo` | Número | **Sí** | Mínimo 0 |
| `nivel_optimo` | Número | **Sí** | Mínimo 0 |


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| nivel_optimo debe ser mayor o igual a nivel_minimo | <!-- PROSA:parametro-reorden.error.nivel-optimo-debe-ser-mayor-o-igual-a-nivel-minimo --> El nivel óptimo quedó por debajo del mínimo, y así los números no tienen sentido: el óptimo es la existencia a la que se quiere llegar reponiendo. Revise los dos valores. <!-- /PROSA --> |


#### 15.3.4 Update

<!-- PROSA:parametro-reorden.update.pasos -->
Ajusta los niveles de un producto. Conviene revisarlos cuando cambia la demanda —temporada alta, un producto que empezó a girar más rápido.
<!-- /PROSA -->


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| nivel_optimo debe ser mayor o igual a nivel_minimo | <!-- PROSA:parametro-reorden.error.nivel-optimo-debe-ser-mayor-o-igual-a-nivel-minimo --> El nivel óptimo quedó por debajo del mínimo, y así los números no tienen sentido: el óptimo es la existencia a la que se quiere llegar reponiendo. Revise los dos valores. <!-- /PROSA --> |


#### 15.3.5 Remove

<!-- PROSA:parametro-reorden.remove.pasos -->
Quita los parámetros de un producto. Deja de avisar cuando su existencia baja.
<!-- /PROSA -->


**Mensajes que puede mostrar el sistema**

| Mensaje | Motivo / Cómo resolverlo |
| --- | --- |
| ParametroReorden {id} no encontrado | <!-- PROSA:parametro-reorden.error.parametroreorden-no-encontrado --> El parámetro fue eliminado o el enlace es viejo. Refresque el listado. <!-- /PROSA --> |


### 15.5 Otras validaciones del módulo

| Mensaje | Se produce en |
| --- | --- |
| ParametroReorden {id} no encontrado | Find one |
