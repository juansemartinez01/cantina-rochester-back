# Feature Specification: Módulo de Caja

**Feature Branch**: `001-modulo-caja`

**Created**: 2026-06-23

**Status**: Draft

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Apertura de caja (Priority: P1)

El cajero inicia su turno abriendo la caja del almacén. Carga el monto inicial en efectivo disponible y queda registrado como responsable del turno. A partir de ese momento el sistema permite registrar cobros, movimientos y retiros asociados a esa sesión.

**Why this priority**: Sin apertura de caja no existe el marco que agrupa todos los demás movimientos del turno. Es el punto de partida obligatorio del flujo completo.

**Independent Test**: Se puede probar abriendo una caja con $50.000 de fondo inicial y verificando que el sistema registra usuario, almacén, fecha/hora y monto correctamente, sin necesidad de ningún otro paso posterior.

**Acceptance Scenarios**:

1. **Given** que no hay ninguna caja abierta en el almacén, **When** el cajero ingresa el monto inicial y confirma la apertura, **Then** el sistema crea la sesión de caja con estado ABIERTA, registra el monto inicial, la fecha/hora y el usuario responsable.
2. **Given** que ya existe una caja ABIERTA en el almacén, **When** cualquier usuario intenta abrir otra caja en el mismo almacén, **Then** el sistema rechaza la apertura e informa que ya existe una sesión activa.
3. **Given** que el cajero quiere dejar una nota al abrir, **When** ingresa una observación opcional, **Then** la observación queda registrada junto a los datos de apertura.

---

### User Story 2 — Movimientos manuales de caja (Priority: P1)

Durante el turno, el cajero necesita registrar ingresos o egresos de dinero que no provienen de una venta: una compra de insumos menores, un refuerzo de caja, un pago de envío. Cada movimiento queda vinculado a la sesión activa.

**Why this priority**: Los movimientos manuales son parte esencial del control de caja. Sin ellos el saldo esperado al cierre sería incorrecto.

**Independent Test**: Se puede probar registrando un egreso manual de $5.000 por "compra de bolsas" sobre una caja abierta, y verificando que el movimiento aparece en el listado de la sesión con tipo, monto, motivo y usuario correcto.

**Acceptance Scenarios**:

1. **Given** que hay una caja ABIERTA, **When** el cajero registra un ingreso manual con monto y motivo obligatorio, **Then** el sistema guarda el movimiento como INGRESO vinculado a la sesión y al usuario.
2. **Given** que hay una caja ABIERTA, **When** el cajero registra un egreso manual con monto y motivo obligatorio, **Then** el sistema guarda el movimiento como EGRESO vinculado a la sesión y al usuario.
3. **Given** que el cajero intenta guardar un movimiento sin motivo, **When** confirma el formulario, **Then** el sistema rechaza la acción e indica que el motivo es obligatorio.
4. **Given** que la caja está CERRADA, **When** cualquier usuario intenta registrar un movimiento manual, **Then** el sistema rechaza la acción e informa que la caja está cerrada.

---

### User Story 3 — Retiro de efectivo (Priority: P2)

El cajero necesita retirar dinero físico de la caja durante el turno sin cerrarlo: para administración, para un pago, o para cualquier otro fin. El retiro queda registrado en la sesión y reduce el efectivo esperado al cierre.

**Why this priority**: Necesario para el cálculo correcto de efectivo esperado al cierre. Sin registro de retiros el cuadre de caja sería siempre incorrecto.

**Independent Test**: Se puede probar registrando un retiro de $100.000 por "administración" sobre una caja abierta y verificando que aparece en el resumen de la sesión con monto, motivo y usuario.

**Acceptance Scenarios**:

1. **Given** que hay una caja ABIERTA, **When** el cajero registra un retiro de efectivo con monto y motivo, **Then** el sistema guarda el retiro vinculado a la sesión, con usuario y fecha/hora.
2. **Given** que la caja está CERRADA, **When** cualquier usuario intenta registrar un retiro, **Then** el sistema rechaza la acción.

---

### User Story 4 — Cierre de caja con cuadre (Priority: P2)

Al final del turno el cajero cuenta el efectivo físico disponible en la caja, lo ingresa en el sistema y lo compara contra el efectivo esperado (calculado por el sistema). La caja queda cerrada y bloqueada para nuevos movimientos.

**Why this priority**: El cierre es el objetivo final del módulo. Sin él no hay control real sobre el dinero en caja.

**Independent Test**: Dado un turno con monto inicial de $50.000, cobros en efectivo de $120.000, egresos manuales de $5.000 y un retiro de $40.000, el sistema debe calcular efectivo esperado de $125.000. Si el cajero ingresa $123.000 como contado, la diferencia debe ser -$2.000.

**Acceptance Scenarios**:

1. **Given** que hay una caja ABIERTA con movimientos registrados, **When** el cajero ingresa el efectivo contado y confirma el cierre, **Then** el sistema calcula el efectivo esperado, calcula la diferencia, registra la fecha/hora de cierre y cambia el estado de la sesión a CERRADA.
2. **Given** que la caja fue cerrada, **When** cualquier usuario intenta registrar un movimiento, **Then** el sistema rechaza la acción indicando que la sesión está cerrada.
3. **Given** que el cierre está completo, **When** el cajero o administrador solicita el reporte de cierre, **Then** el sistema muestra: monto inicial, total cobros por medio de pago, total ingresos manuales, total egresos, total retiros, efectivo esperado, efectivo contado, diferencia, usuario y fechas de apertura y cierre.

---

### User Story 5 — Anulación de movimientos manuales (Priority: P3)

El administrador detecta que se cargó un movimiento manual con datos incorrectos. Puede anularlo indicando un motivo obligatorio. El movimiento queda marcado como anulado pero permanece en el historial para auditoría.

**Why this priority**: Necesario para corregir errores sin perder trazabilidad. No afecta el flujo principal del cajero.

**Independent Test**: Se puede probar anulando un movimiento con motivo "importe incorrecto" y verificando que el movimiento aparece como ANULADO en el historial pero sigue visible, y que el efectivo esperado de la sesión se recalcula excluyendo ese movimiento.

**Acceptance Scenarios**:

1. **Given** que existe un movimiento manual no anulado, **When** el administrador lo anula con un motivo, **Then** el movimiento queda marcado como ANULADO, el motivo y el usuario que anuló quedan registrados.
2. **Given** que el administrador intenta anular sin motivo, **When** confirma la anulación, **Then** el sistema rechaza la acción indicando que el motivo es obligatorio.
3. **Given** que un movimiento ya está anulado, **When** alguien intenta anularlo nuevamente, **Then** el sistema rechaza la acción.

---

### User Story 6 — Consulta de estado de caja activa (Priority: P3)

El cajero o administrador quiere ver el estado actual de la caja: cuánto se cobró, qué movimientos manuales hubo, cuánto se retiró y cuánto efectivo se espera tener en este momento.

**Why this priority**: Útil durante el turno para monitoreo, pero el módulo funciona sin esta vista en tiempo real.

**Independent Test**: Se puede probar abriendo una caja, registrando algunos movimientos y verificando que el resumen en tiempo real muestra los totales correctos.

**Acceptance Scenarios**:

1. **Given** que hay una caja ABIERTA, **When** el cajero consulta el estado actual, **Then** el sistema muestra el resumen parcial: monto inicial, cobros de ventas del período por medio de pago, movimientos manuales, retiros y saldo de efectivo esperado hasta el momento.

---

### Edge Cases

- ¿Qué pasa si el sistema se interrumpe durante el cierre? La caja debe permanecer en estado ABIERTA hasta que el cierre se confirme completamente.
- ¿Qué pasa si se intenta abrir una caja en un almacén que no existe? El sistema debe rechazarlo.
- ¿Qué pasa si el monto inicial ingresado es cero? Se permite (caja arranca vacía).
- ¿Qué pasa si el efectivo contado al cierre es mayor al esperado? La diferencia es positiva (sobrante) y queda registrada igualmente.
- ¿Qué pasa si hay una caja abierta de un día anterior (turno nunca cerrado)? El sistema debe poder detectarla y el administrador debe poder cerrarla o anularla.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir abrir una sesión de caja por almacén, registrando usuario responsable, monto inicial en efectivo, fecha/hora de apertura y observación opcional.
- **FR-002**: El sistema DEBE impedir que existan dos sesiones de caja ABIERTAS simultáneamente en el mismo almacén.
- **FR-003**: El sistema DEBE permitir registrar movimientos manuales (INGRESO o EGRESO) vinculados a la sesión de caja activa, con motivo obligatorio, monto, observación opcional y usuario.
- **FR-004**: El sistema DEBE impedir registrar movimientos sobre una sesión de caja CERRADA.
- **FR-005**: El sistema DEBE permitir registrar retiros de efectivo vinculados a la sesión activa, con motivo obligatorio, monto y usuario.
- **FR-006**: El sistema DEBE calcular automáticamente el efectivo esperado al cierre usando la fórmula: monto_inicial + cobros_efectivo_del_período + ingresos_manuales - egresos_manuales - retiros.
- **FR-007**: El sistema DEBE permitir registrar el efectivo contado real al cierre, calcular la diferencia (contado - esperado) y cerrar la sesión cambiando su estado a CERRADA.
- **FR-008**: El sistema DEBE tomar los cobros de ventas del período directamente desde los registros existentes del sistema (no duplicar esa información), filtrando por el rango de tiempo de la sesión de caja y el almacén correspondiente.
- **FR-009**: El sistema DEBE generar un reporte de cierre que incluya: monto inicial, total cobrado por cada medio de pago, total ingresos manuales, total egresos manuales, total retiros, efectivo esperado, efectivo contado, diferencia, usuario responsable, fecha/hora de apertura y cierre.
- **FR-010**: El sistema DEBE permitir al administrador anular movimientos manuales con motivo obligatorio, registrando quién anuló y cuándo, sin eliminar el registro del historial.
- **FR-011**: Los movimientos anulados NO deben incluirse en el cálculo del saldo esperado.
- **FR-012**: Un cajero DEBE poder abrir caja, registrar movimientos y cerrar caja.
- **FR-013**: Un administrador DEBE poder anular movimientos, ver reportes de cualquier sesión y consultar el historial de sesiones cerradas.
- **FR-014**: El sistema DEBE mostrar el estado en tiempo real de la caja activa (cobros del período + movimientos + retiros + saldo esperado parcial).

### Key Entities

- **SesiónCaja**: Representa un turno de caja en un almacén específico. Atributos clave: almacén, usuario responsable, monto inicial, estado (ABIERTA/CERRADA), fecha/hora de apertura, fecha/hora de cierre, efectivo contado, diferencia, observación de apertura.
- **MovimientoCaja**: Ingreso o egreso manual de dinero no originado en una venta. Atributos: tipo (INGRESO/EGRESO/RETIRO), monto, motivo, observación, usuario, sesión de caja, estado (ACTIVO/ANULADO), usuario que anuló, motivo de anulación, fecha/hora.
- **CobrosDeVenta** *(existente, no nuevo)*: Los pagos de ventas ya registrados en el sistema. La caja los consulta por rango de tiempo y almacén para incluirlos en el resumen.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un cajero puede completar el flujo completo (apertura → movimientos → cierre) en menos de 5 minutos sin asistencia técnica.
- **SC-002**: El saldo esperado calculado al cierre coincide exactamente con la suma manual de monto inicial + cobros efectivo + ingresos - egresos - retiros en el 100% de los casos probados.
- **SC-003**: El sistema impide en el 100% de los casos que se registren movimientos sobre una caja cerrada.
- **SC-004**: El reporte de cierre refleja todos los movimientos del turno sin omisiones ni duplicados.
- **SC-005**: Una anulación queda registrada con motivo y usuario en el 100% de los casos; nunca se permite anular sin motivo.
- **SC-006**: No puede existir más de una sesión ABIERTA por almacén en ningún momento.

---

## Assumptions

- Los cobros de ventas ya se registran en el sistema a través del flujo de ventas existente; la caja los consulta sin modificarlos.
- El sistema de autenticación y roles ya existe; los permisos de cajero y administrador se aplican sobre la infraestructura de roles actual.
- Una sesión de caja está asociada a un único almacén; si hay múltiples almacenes, cada uno tiene su propia caja independiente.
- Los medios de pago para el reporte de cierre se clasifican en: Efectivo, Transferencia, Tarjeta, Mercado Pago y otros (agrupando los medios existentes en el sistema).
- El retiro de efectivo se modela como un tipo especial de movimiento manual (RETIRO) dentro de la misma entidad de movimientos, para simplificar el modelo de datos.
- El módulo no contempla facturación fiscal ni integración con organismos impositivos en esta versión.
- El módulo no contempla devoluciones ni notas de crédito en esta versión.
- Las sesiones de caja de días anteriores que quedaron abiertas por error deben ser gestionadas por un administrador; el sistema no las cierra automáticamente.
- La exportación o impresión del reporte de cierre queda fuera del alcance de esta versión (se muestra en pantalla).
