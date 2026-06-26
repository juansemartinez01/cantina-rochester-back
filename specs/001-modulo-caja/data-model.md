# Data Model: Módulo de Caja

**Feature**: 001-modulo-caja
**Date**: 2026-06-23

---

## Entidades nuevas

### SesionCaja

Representa una sesión de caja (turno) para un almacén específico.

| Campo | Tipo TypeORM | Nulo | Default | Descripción |
|-------|-------------|------|---------|-------------|
| `id` | PrimaryGeneratedColumn | No | auto | PK |
| `almacen_id` | ManyToOne → Almacen | No | — | Almacén al que pertenece la caja |
| `usuario_id` | ManyToOne → Usuario | No | — | Cajero que abrió la sesión |
| `monto_inicial` | decimal(12,2) | No | — | Fondo inicial en efectivo |
| `estado` | enum: ABIERTA \| CERRADA | No | ABIERTA | Estado de la sesión |
| `observacion` | varchar(500) | Sí | null | Nota de apertura |
| `fecha_apertura` | CreateDateColumn | No | NOW() | Timestamp automático de apertura |
| `fecha_cierre` | timestamp | Sí | null | Completado al cerrar |
| `efectivo_contado` | decimal(12,2) | Sí | null | Monto contado físicamente al cierre |
| `diferencia` | decimal(12,2) | Sí | null | efectivo_contado - efectivo_esperado (calculado al cierre) |

**Índices**: `(almacen_id, estado)` — para consultar si hay caja ABIERTA por almacén en O(1).

**Regla de negocio**: Solo puede existir un registro con `(almacen_id, estado='ABIERTA')` a la vez (validada en servicio, no como constraint de DB).

---

### MovimientoCaja

Registra cada movimiento manual (ingreso, egreso o retiro) dentro de una sesión.

| Campo | Tipo TypeORM | Nulo | Default | Descripción |
|-------|-------------|------|---------|-------------|
| `id` | PrimaryGeneratedColumn | No | auto | PK |
| `caja_id` | ManyToOne → SesionCaja | No | — | Sesión a la que pertenece |
| `tipo` | enum: INGRESO \| EGRESO \| RETIRO | No | — | Tipo de movimiento |
| `monto` | decimal(12,2) | No | — | Importe del movimiento |
| `motivo` | varchar(500) | No | — | Motivo obligatorio |
| `observacion` | varchar(500) | Sí | null | Nota adicional opcional |
| `usuario_id` | ManyToOne → Usuario | No | — | Usuario que registró |
| `fecha` | CreateDateColumn | No | NOW() | Timestamp automático |
| `anulado` | boolean | No | false | Indica si fue anulado |
| `motivo_anulacion` | varchar(500) | Sí | null | Motivo de anulación |
| `anulado_por_id` | ManyToOne → Usuario | Sí | null | Usuario que anuló |
| `fecha_anulacion` | timestamp | Sí | null | Timestamp de anulación |

**Regla**: `anulado = true` excluye al movimiento del cálculo de saldo.

---

## Entidades existentes involucradas (sin modificar)

### IngresoVenta *(solo lectura desde CajaService)*

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | PK | — |
| `venta_id` | FK → Venta | — |
| `tipo` | EFECTIVO \| BANCARIZADO | Medio de pago normalizado |
| `monto` | decimal(12,2) | Importe pagado |
| `fecha` | CreateDateColumn | Timestamp del pago |

La relación `Venta.almacen_id` permite filtrar cobros por almacén y período.

### Almacen *(FK desde SesionCaja)*

Existente en `src/almacen/`. No se modifica.

### Usuario *(FK desde SesionCaja y MovimientoCaja)*

Existente en `src/usuario/`. No se modifica.

---

## Transiciones de estado (SesionCaja)

```
[inicio] ──── abrir() ────► ABIERTA ──── cerrar() ────► CERRADA
                               │
                               ├─── agregar movimiento (INGRESO/EGRESO/RETIRO)
                               └─── anular movimiento (admin)
```

Una sesión `CERRADA` es inmutable. No acepta nuevos movimientos ni puede reabrirse.

---

## Estructura de módulo en código

```
src/
└── caja/
    ├── caja.module.ts
    ├── caja.controller.ts
    ├── caja.service.ts
    ├── sesion-caja.entity.ts
    ├── movimiento-caja.entity.ts
    └── dto/
        ├── abrir-caja.dto.ts
        ├── agregar-movimiento.dto.ts
        └── cerrar-caja.dto.ts
```
