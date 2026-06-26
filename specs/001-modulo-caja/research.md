# Research: Módulo de Caja

**Feature**: 001-modulo-caja
**Date**: 2026-06-23

---

## Decisión 1: Estructura del módulo — ¿nuevo módulo o extensión?

**Decision**: Módulo nuevo `src/caja/` con dos entidades propias: `SesionCaja` y `MovimientoCaja`.

**Rationale**: El concepto de "sesión de caja" no existe en ningún módulo actual. No es una extensión de Venta, Ingreso, Extracción ni Gastos — es una capa de agrupación/control sobre todos ellos. Merece su propio módulo por responsabilidad propia.

**Alternatives considered**:
- Extender `extraccion/`: Rechazado — Extracción es un concepto de retiro individual, no un contenedor de sesión.
- Extender `ingreso/`: Rechazado — IngresoVenta es una línea de pago de venta, no un período de caja.

---

## Decisión 2: Entidades del módulo

**Decision**: Dos entidades — `SesionCaja` y `MovimientoCaja`.

**Rationale**:
- `SesionCaja`: Representa el período entre apertura y cierre. Contiene los metadatos de la sesión (usuario, almacén, monto inicial, estado, diferencia al cierre).
- `MovimientoCaja`: Captura TODOS los movimientos manuales de la sesión — ingresos, egresos Y retiros — usando un campo `tipo` enum (INGRESO | EGRESO | RETIRO). Esto evita crear una tercera entidad para retiros y simplifica el modelo.

**Alternatives considered**:
- Entidad separada `RetiroCaja`: Rechazado — agrega complejidad sin beneficio real dado que retiro es semánticamente un egreso con tipo específico.
- Reutilizar `ExtraccionIngreso` con caja_id: Rechazado — ExtraccionIngreso tiene lógica de validación de balance propia que no aplica en el contexto de sesión de caja. Agregar caja_id acoplaría módulos incorrectamente.

---

## Decisión 3: Integración con IngresoVenta (cobros de ventas)

**Decision**: El `CajaService` inyecta el repositorio de `IngresoVenta` directamente (TypeORM repository injection) para consultar cobros del período.

**Query de cobros de sesión**:
```
SELECT SUM(iv.monto), iv.tipo
FROM ingreso_venta iv
JOIN venta v ON iv.venta_id = v.id
WHERE v.almacen_id = :almacen_id
  AND iv.fecha BETWEEN :fecha_apertura AND :fecha_consulta
GROUP BY iv.tipo
```

El `CajaModule` importa `TypeOrmModule.forFeature([SesionCaja, MovimientoCaja, IngresoVenta])` para acceder al repositorio sin crear dependencia circular.

**Alternatives considered**:
- Inyectar `IngresoVentaService`: Requeriría exportar el service y acoplar los módulos mediante importación mutua. El repositorio directo es más limpio para una query de solo lectura.

---

## Decisión 4: Granularidad del reporte de medios de pago

**Decision**: El reporte distingue EFECTIVO vs BANCARIZADO (los dos valores del enum `tipo` en `IngresoVenta`). No desglosa Transferencia / Tarjeta / Mercado Pago individualmente porque esa información no se persiste en la tabla existente.

**Rationale**: IngresoVenta.tipo solo tiene 'EFECTIVO' | 'BANCARIZADO' — la normalización del medio de pago específico ocurre en VentaService al crear la venta. Cambiar IngresoVenta para guardar el medio de pago específico está fuera del alcance de este módulo.

**Alternatives considered**:
- Modificar IngresoVenta para agregar campo `medio_pago_detalle`: Fuera de scope — cambiaría un módulo existente con datos en producción.

---

## Decisión 5: Permisos de Cajero vs Administrador

**Decision**: Usar el sistema de roles existente (`Role` / `UsuarioRol`). Agregar un guard de roles en los endpoints sensibles.

El proyecto ya tiene `@Role()` decorator y lógica de roles en `src/role/`. Los endpoints de anulación y reporte histórico usan `@Role('administrador')`. Los endpoints de cajero (abrir, movimiento, cerrar) permiten ambos roles.

**Rationale**: La infraestructura de roles existe y funciona. No crear un sistema paralelo.

---

## Decisión 6: Bloqueo de caja cerrada

**Decision**: El `CajaService` verifica el estado `ABIERTA` antes de aceptar cualquier mutación (movimiento, retiro, cierre). Si el estado es `CERRADA`, lanza `BadRequestException`.

---

## Decisión 7: Anulación de movimientos

**Decision**: Soft-delete mediante campos en `MovimientoCaja`: `anulado: boolean`, `motivo_anulacion: varchar`, `anulado_por_id: FK → Usuario`, `fecha_anulacion: timestamp`.

Los movimientos anulados se excluyen del cálculo de efectivo esperado (`WHERE anulado = false`).

**Rationale**: Mantener historial completo para auditoría. TypeORM tiene soporte nativo para soft-delete con `@DeleteDateColumn` pero el patrón del proyecto usa campos explícitos (ver `gastos`).

---

## Decisión 8: Cálculo de efectivo esperado

**Formula**:
```
efectivo_esperado =
  sesion.monto_inicial
  + SUM(IngresoVenta WHERE tipo='EFECTIVO' AND almacen=sesion.almacen AND fecha IN período)
  + SUM(MovimientoCaja WHERE tipo=INGRESO AND anulado=false)
  - SUM(MovimientoCaja WHERE tipo=EGRESO AND anulado=false)
  - SUM(MovimientoCaja WHERE tipo=RETIRO AND anulado=false)
```

Este cálculo es dinámico (ejecutado en el momento de consulta), no persistido hasta el cierre.
