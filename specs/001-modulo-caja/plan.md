# Implementation Plan: Módulo de Caja

**Branch**: `001-modulo-caja` | **Date**: 2026-06-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-modulo-caja/spec.md`

---

## Summary

Agregar un módulo de caja (`src/caja/`) que gestiona sesiones de turno por almacén. Cada sesión agrupa movimientos manuales (ingresos, egresos, retiros) y consulta los cobros de ventas existentes (`IngresoVenta`) del período para calcular el saldo esperado y la diferencia al cierre. No duplica lógica de ventas ni pagos — los reutiliza por consulta directa.

---

## Technical Context

**Language/Version**: TypeScript 5.8.3

**Primary Dependencies**: NestJS 11.0.1, TypeORM 0.3.23, class-validator, class-transformer, Passport JWT

**Storage**: PostgreSQL — 2 tablas nuevas (`sesion_caja`, `movimiento_caja`), consultas de solo lectura sobre `ingreso_venta` y `venta`

**Testing**: Sin tests (principio V de la constitución)

**Target Platform**: REST API — servidor Node.js en Railway

**Project Type**: web-service (NestJS REST API)

**Performance Goals**: Respuesta < 500ms para cierre de caja (agrega movimientos de un turno, típicamente < 200 registros)

**Constraints**: `synchronize: true` — las 2 entidades nuevas no modifican tablas existentes

**Scale/Scope**: 1 caja por almacén simultáneamente; turnos diarios típicamente de 8-12h

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Nota |
|-----------|--------|------|
| I. Feature Module Isolation | ✅ PASS | Módulo `src/caja/` con controller, service, 2 entities, module |
| II. JWT Global / @Public() | ✅ PASS | Todos los endpoints protegidos por JWT global; ninguno requiere @Public() |
| III. TypeORM synchronize | ✅ PASS | 2 entidades nuevas; no se modifica ninguna tabla existente |
| IV. DTOs + class-validator | ✅ PASS | AbrirCajaDto, AgregarMovimientoDto, CerrarCajaDto con decoradores |
| V. Sin tests | ✅ PASS | No se agregan tests |
| VI. CORS fijo | ✅ PASS | No se modifica main.ts |

**Todos los gates pasan. Sin violaciones.**

---

## Project Structure

### Documentation (this feature)

```text
specs/001-modulo-caja/
├── spec.md              ✅ creado
├── plan.md              ✅ este archivo
├── research.md          ✅ creado
├── data-model.md        ✅ creado
├── quickstart.md        ✅ creado
├── contracts/
│   └── caja-api.md      ✅ creado
├── checklists/
│   └── requirements.md  ✅ creado
└── tasks.md             ← creado por /speckit-tasks
```

### Source Code (repository root)

```text
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

**Archivos existentes a modificar**:
- `src/app.module.ts` — agregar `CajaModule` al array `imports`

**Structure Decision**: Módulo NestJS canónico con sub-carpeta `dto/` dado que hay 3 DTOs distintos. Sigue el patrón de los 22 módulos existentes.

---

## Decisiones de arquitectura clave

### Integración con IngresoVenta

El `CajaModule` importa `TypeOrmModule.forFeature([SesionCaja, MovimientoCaja, IngresoVenta])` para acceder al repositorio de `IngresoVenta` desde el service sin acoplar módulos. No importa `IngresoVentaModule` — solo necesita el repositorio para queries de solo lectura.

### Tipos de movimiento

`MovimientoCaja.tipo` = `INGRESO | EGRESO | RETIRO`. RETIRO es semánticamente un egreso de efectivo especial modelado dentro de la misma entidad para simplificar el modelo (evita una tercera entidad).

### Permisos

- `Cajero`: abrir, crear movimiento, cerrar, ver estado activo
- `Administrador`: todo lo anterior + anular movimientos + ver historial
- Implementado con el guard de roles existente en el proyecto

### Anulación

Soft-delete explícito con campos `anulado: boolean`, `motivo_anulacion`, `anulado_por_id`, `fecha_anulacion` en `MovimientoCaja`. Los anulados se excluyen del cálculo con `WHERE anulado = false`.

---

## Endpoints a implementar

| Método | Path | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/caja/abrir` | Cajero/Admin | Abre sesión de caja |
| GET | `/caja/activa?almacen_id=` | Cajero/Admin | Estado de caja activa con resumen |
| POST | `/caja/:id/movimiento` | Cajero/Admin | Agrega movimiento manual |
| POST | `/caja/:id/cerrar` | Cajero/Admin | Cierra la sesión con conteo real |
| GET | `/caja/:id/reporte` | Cajero/Admin | Reporte de sesión |
| PATCH | `/caja/movimiento/:id/anular` | Admin | Anula un movimiento |
| GET | `/caja/historial` | Admin | Lista sesiones paginadas |

Ver contratos completos en [contracts/caja-api.md](contracts/caja-api.md).

---

## Fórmula de efectivo esperado

```
efectivo_esperado =
  sesion.monto_inicial
  + Σ(IngresoVenta.monto WHERE tipo='EFECTIVO'
      AND venta.almacen_id = sesion.almacen_id
      AND ingreso_venta.fecha BETWEEN sesion.fecha_apertura AND ahora/fecha_cierre)
  + Σ(MovimientoCaja.monto WHERE tipo='INGRESO' AND anulado=false AND caja_id=sesion.id)
  - Σ(MovimientoCaja.monto WHERE tipo='EGRESO'  AND anulado=false AND caja_id=sesion.id)
  - Σ(MovimientoCaja.monto WHERE tipo='RETIRO'  AND anulado=false AND caja_id=sesion.id)
```

---

## Complexity Tracking

> Sin violaciones de constitución.
