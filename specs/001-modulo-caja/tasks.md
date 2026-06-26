# Tasks: MÃ³dulo de Caja

**Input**: Design documents from `/specs/001-modulo-caja/`

**Prerequisites**: plan.md âœ… Â· spec.md âœ… Â· research.md âœ… Â· data-model.md âœ… Â· contracts/ âœ…

**Tests**: No â€” la constituciÃ³n del proyecto establece que no se agregan tests.

**Organization**: Tareas agrupadas por user story. Cada story es un incremento testeable independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin dependencias incompletas)
- **[Story]**: A quÃ© user story pertenece (US1â€“US6)
- Todos los paths son relativos a la raÃ­z del repositorio

---

## Phase 1: Setup (Estructura del mÃ³dulo)

**Purpose**: Crear el esqueleto de archivos del mÃ³dulo `caja` para que las fases siguientes puedan operar en paralelo.

- [x] T001 Crear directorio `src/caja/` y subdirectorio `src/caja/dto/` (estructura vacÃ­a)

---

## Phase 2: Foundational (Prerequisitos bloqueantes)

**Purpose**: Entidades, DTOs, mÃ³dulo registrado y skeletons de service/controller. Nada del flujo de negocio puede implementarse hasta que esta fase estÃ© completa.

**âš ï¸ CRÃTICO**: Ninguna user story puede comenzar hasta completar esta fase.

- [x] T002 Crear entidad `SesionCaja` en `src/caja/sesion-caja.entity.ts` con todos los campos del data-model (id, almacen_id, usuario_id, monto_inicial, estado enum ABIERTA|CERRADA, observacion, fecha_apertura, fecha_cierre, efectivo_contado, diferencia)
- [x] T003 [P] Crear entidad `MovimientoCaja` en `src/caja/movimiento-caja.entity.ts` con todos los campos del data-model (id, caja_id, tipo enum INGRESO|EGRESO|RETIRO, monto, motivo, observacion, usuario_id, fecha, anulado, motivo_anulacion, anulado_por_id, fecha_anulacion)
- [x] T004 [P] Crear `AbrirCajaDto` en `src/caja/dto/abrir-caja.dto.ts` con decoradores class-validator (almacen_id: IsNumber requerido, monto_inicial: IsNumber>=0 requerido, observacion: IsString IsOptional max 500)
- [x] T005 [P] Crear `AgregarMovimientoDto` en `src/caja/dto/agregar-movimiento.dto.ts` (tipo: IsEnum INGRESO|EGRESO|RETIRO requerido, monto: IsNumber>0 requerido, motivo: IsString MinLength(3) requerido, observacion: IsString IsOptional)
- [x] T006 [P] Crear `CerrarCajaDto` en `src/caja/dto/cerrar-caja.dto.ts` (efectivo_contado: IsNumber>=0 requerido)
- [x] T007 Crear `CajaModule` en `src/caja/caja.module.ts` importando `TypeOrmModule.forFeature([SesionCaja, MovimientoCaja, IngresoVenta])`, declarando controller y provider
- [x] T008 Registrar `CajaModule` en el array `imports` de `src/app.module.ts`
- [x] T009 Crear skeleton de `CajaService` en `src/caja/caja.service.ts` con constructor inyectando los repositorios de `SesionCaja`, `MovimientoCaja` e `IngresoVenta`
- [x] T010 Crear skeleton de `CajaController` en `src/caja/caja.controller.ts` con decorator `@Controller('caja')` e inyecciÃ³n del service

**Checkpoint**: El servidor debe arrancar sin errores (`npm run start:dev`) antes de continuar.

---

## Phase 3: User Story 1 â€” Apertura de caja (Priority: P1) ðŸŽ¯ MVP

**Goal**: Un cajero puede abrir una sesiÃ³n de caja registrando monto inicial, usuario y almacÃ©n. El sistema impide doble apertura en el mismo almacÃ©n.

**Independent Test**: `POST /caja/abrir` con `almacen_id=1` y `monto_inicial=50000` retorna 201 con `"estado":"ABIERTA"`. Un segundo intento en el mismo almacÃ©n retorna 400.

- [x] T011 [US1] Implementar `CajaService.abrir()` en `src/caja/caja.service.ts`: verificar que no exista SesionCaja con estado='ABIERTA' y mismo almacen_id (lanzar BadRequestException si existe), crear y guardar nueva SesionCaja con usuario del JWT
- [x] T012 [US1] Implementar `POST /caja/abrir` en `src/caja/caja.controller.ts` usando `AbrirCajaDto`, extraer usuario del request JWT y pasarlo al service

**Checkpoint**: Completar flujo 1 del quickstart.md paso 1 â€” `POST /caja/abrir` devuelve sesiÃ³n con estado ABIERTA. Segunda llamada retorna 400.

---

## Phase 4: User Story 2 â€” Movimientos manuales (Priority: P1)

**Goal**: Un cajero puede registrar ingresos y egresos manuales vinculados a la sesiÃ³n activa. El motivo es obligatorio. No se puede registrar en una caja cerrada.

**Independent Test**: `POST /caja/42/movimiento` con `tipo=EGRESO`, `monto=5000`, `motivo="Compra bolsas"` retorna 201. Llamada sin motivo retorna 400 por ValidationPipe. Llamada sobre caja cerrada retorna 400.

- [x] T013 [US2] Implementar `CajaService.agregarMovimiento()` en `src/caja/caja.service.ts`: verificar que la sesiÃ³n exista y estÃ© ABIERTA (BadRequestException si no), crear y guardar MovimientoCaja con el usuario del JWT
- [x] T014 [US2] Implementar helper privado `CajaService.calcularResumen()` en `src/caja/caja.service.ts`: ejecutar query de IngresoVenta (JOIN venta WHERE almacen_id y fecha BETWEEN apertura y ahora), sumar MovimientoCaja por tipo (excluyendo anulados), retornar objeto con cobros_efectivo, cobros_bancarizado, ingresos_manuales, egresos_manuales, retiros, efectivo_esperado
- [x] T015 [US2] Implementar `POST /caja/:id/movimiento` en `src/caja/caja.controller.ts` usando `AgregarMovimientoDto`

**Checkpoint**: `POST /caja/42/movimiento` tipo INGRESO y EGRESO funcionan correctamente. Motivo vacÃ­o retorna 400. Caja cerrada retorna 400.

---

## Phase 5: User Story 3 â€” Retiro de efectivo (Priority: P2)

**Goal**: El cajero puede registrar retiros de efectivo usando el mismo endpoint de movimientos con `tipo=RETIRO`. Los retiros reducen el efectivo esperado al cierre.

**Independent Test**: `POST /caja/42/movimiento` con `tipo=RETIRO`, `monto=40000`, `motivo="Retiro para administraciÃ³n"` retorna 201 con `"tipo":"RETIRO"`. El resumen de la sesiÃ³n refleja el retiro en `retiros` y ajusta `efectivo_esperado`.

- [x] T016 [US3] Verificar que `CajaService.calcularResumen()` incluye RETIRO en la suma de egresos separadamente (`retiros` en el objeto de resumen) â€” ajustar si es necesario en `src/caja/caja.service.ts`
- [x] T017 [US3] Verificar que el AgregarMovimientoDto acepta `tipo=RETIRO` (ya deberÃ­a por el enum INGRESO|EGRESO|RETIRO definido en T005 â€” confirmar y ajustar si hace falta)

**Checkpoint**: `POST /caja/42/movimiento` tipo RETIRO funciona y el valor aparece desglosado en `retiros` del resumen (validado en fase siguiente con GET /caja/activa).

---

## Phase 6: User Story 4 â€” Cierre de caja con cuadre (Priority: P2)

**Goal**: El cajero cierra la sesiÃ³n ingresando el efectivo contado. El sistema calcula el esperado, registra la diferencia y bloquea nuevos movimientos.

**Independent Test**: Dado el escenario del quickstart (monto_inicial=50000, cobros_efectivo=120000, egresos=5000, retiros=40000): `POST /caja/42/cerrar` con `efectivo_contado=123000` retorna 200 con `efectivo_esperado=125000`, `diferencia=-2000`, `estado=CERRADA`. Posterior intento de movimiento retorna 400.

- [x] T018 [US4] Implementar `CajaService.cerrar()` en `src/caja/caja.service.ts`: verificar estado ABIERTA, llamar a `calcularResumen()` para obtener efectivo_esperado, calcular diferencia (efectivo_contado - efectivo_esperado), actualizar sesiÃ³n (estado=CERRADA, fecha_cierre, efectivo_contado, diferencia), retornar reporte completo
- [x] T019 [US4] Implementar `CajaService.getReporte()` en `src/caja/caja.service.ts`: cargar sesiÃ³n con movimientos y calcular resumen (funciona para sesiones ABIERTA y CERRADA)
- [x] T020 [US4] Implementar `POST /caja/:id/cerrar` en `src/caja/caja.controller.ts` usando `CerrarCajaDto`
- [x] T021 [US4] Implementar `GET /caja/:id/reporte` en `src/caja/caja.controller.ts`
- [x] T022 [US4] Implementar `GET /caja/activa?almacen_id=` en `src/caja/caja.controller.ts` + mÃ©todo `CajaService.obtenerActiva()` en `src/caja/caja.service.ts` (retorna sesiÃ³n ABIERTA con resumen_parcial calculado)

**Checkpoint**: Completar flujos 1â€“3 completos del quickstart.md. Cierre retorna diferencia correcta. Movimiento tras cierre retorna 400.

---

## Phase 7: User Story 5 â€” AnulaciÃ³n de movimientos (Priority: P3)

**Goal**: Un administrador puede anular un movimiento manual indicando motivo obligatorio. El movimiento queda en historial como ANULADO y se excluye del cÃ¡lculo de saldo.

**Independent Test**: `PATCH /caja/movimiento/15/anular` con `motivo_anulacion="Importe incorrecto"` retorna 200 con `"anulado":true`. Sin motivo retorna 400. El reporte de la sesiÃ³n no incluye el movimiento anulado en los totales.

- [x] T023 [US5] Crear `AnularMovimientoDto` en `src/caja/dto/anular-movimiento.dto.ts` (motivo_anulacion: IsString MinLength(5) requerido)
- [x] T024 [US5] Implementar `CajaService.anularMovimiento()` en `src/caja/caja.service.ts`: buscar MovimientoCaja, verificar que no estÃ© ya anulado (BadRequestException), setear anulado=true, motivo_anulacion, anulado_por_id (del JWT), fecha_anulacion, guardar
- [x] T025 [US5] Implementar `PATCH /caja/movimiento/:id/anular` en `src/caja/caja.controller.ts` usando `AnularMovimientoDto`

**Checkpoint**: Completar flujo 4 del quickstart.md. AnulaciÃ³n funciona. El reporte excluye movimientos anulados del cÃ¡lculo.

---

## Phase 8: User Story 6 â€” Consulta de estado en tiempo real (Priority: P3)

**Goal**: El cajero consulta el estado actual de la caja activa y ve el resumen parcial en tiempo real (cobros, movimientos, efectivo esperado hasta el momento).

**Independent Test**: `GET /caja/activa?almacen_id=1` retorna la sesiÃ³n ABIERTA con `resumen_parcial` completo incluyendo todos los tipos de movimiento y efectivo_esperado actualizado.

- [x] T026 [US6] Verificar que `GET /caja/activa?almacen_id=` (implementado en T022) retorna `resumen_parcial` con todos los campos requeridos por el contrato en `contracts/caja-api.md`; ajustar response shape en controller y service si es necesario

**Checkpoint**: El endpoint GET /caja/activa retorna resumen_parcial completo y correcto incluyendo retiros separados de egresos.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Historial de sesiones para administradores y validaciÃ³n completa del mÃ³dulo.

- [x] T027 [P] Implementar `CajaService.listarSesiones()` en `src/caja/caja.service.ts` con filtros opcionales (almacen_id, desde, hasta) y paginaciÃ³n (page, limit)
- [x] T028 [P] Implementar `GET /caja/historial` en `src/caja/caja.controller.ts` (solo para rol administrador)
- [x] T029 Ejecutar y validar todos los flujos del `specs/001-modulo-caja/quickstart.md` contra el servidor corriendo

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias â€” empezar inmediatamente
- **Foundational (Phase 2)**: Depende de Phase 1 â€” BLOQUEA todas las user stories
- **US1 (Phase 3)**: Depende de Phase 2 â€” Prerequisito de todo el resto
- **US2 (Phase 4)**: Depende de Phase 2 + US1 (necesita sesiÃ³n abierta para registrar movimientos)
- **US3 (Phase 5)**: Depende de Phase 2 + US2 (RETIRO es un tipo de movimiento)
- **US4 (Phase 6)**: Depende de Phase 2 + US2 + US3 (cierre usa calcularResumen que incluye todos los tipos)
- **US5 (Phase 7)**: Depende de Phase 2 + US2 (anula movimientos manuales)
- **US6 (Phase 8)**: Depende de Phase 6 (reutiliza calcularResumen y GET /caja/activa)
- **Polish (Phase 9)**: Depende de todas las user stories

### User Story Dependencies

```
Setup â†’ Foundational â†’ US1 (Apertura)
                          â””â†’ US2 (Movimientos) â†’ US3 (Retiro) â†’ US4 (Cierre) â†’ US6 (Estado)
                          â””â†’ US5 (AnulaciÃ³n) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

US5 puede implementarse en paralelo con US3 y US4 (opera sobre MovimientoCaja ya creado en US2).

### Parallel Opportunities

- T002, T003, T004, T005, T006 en Phase 2 pueden correr en paralelo (archivos distintos)
- T027 y T028 en Phase 9 pueden correr en paralelo
- US5 puede trabajarse en paralelo con US3/US4 tras completar US2

---

## Parallel Example: Phase 2 (Foundational)

```
Lanzar en paralelo (archivos independientes):
  T003: src/caja/movimiento-caja.entity.ts
  T004: src/caja/dto/abrir-caja.dto.ts
  T005: src/caja/dto/agregar-movimiento.dto.ts
  T006: src/caja/dto/cerrar-caja.dto.ts

Secuencial (depende de los anteriores):
  T002: src/caja/sesion-caja.entity.ts (primero para tener la entidad base)
  T007: src/caja/caja.module.ts (necesita ambas entidades)
  T008: src/app.module.ts
  T009: src/caja/caja.service.ts (skeleton)
  T010: src/caja/caja.controller.ts (skeleton)
```

---

## Implementation Strategy

### MVP (User Stories 1 + 2 Ãºnicamente)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (**CRÃTICO** â€” servidor debe arrancar)
3. Completar Phase 3: US1 â€” Apertura de caja
4. Completar Phase 4: US2 â€” Movimientos manuales
5. **PARAR y VALIDAR**: Abrir caja, agregar egresos/ingresos, verificar que el motivo es obligatorio
6. El sistema ya es funcional para uso bÃ¡sico de cajero

### Entrega incremental

1. Setup + Foundational â†’ Arranque del servidor âœ“
2. US1 â†’ Apertura funciona âœ“
3. US2 â†’ Movimientos funcionan âœ“
4. US3 â†’ Retiros funcionan âœ“
5. US4 â†’ Cierre con cuadre funciona âœ“ (mÃ³dulo completo en uso)
6. US5 + US6 â†’ AnulaciÃ³n y estado en tiempo real âœ“
7. Polish â†’ Historial para admin âœ“

---

## Notes

- [P] = archivos distintos, sin dependencias entre sÃ­
- Sin tests (constituciÃ³n del proyecto, principio V)
- El endpoint `PATCH /caja/movimiento/:id/anular` requiere verificar rol administrador con el guard existente
- `calcularResumen()` es el helper central â€” implementarlo bien en T014 es crÃ­tico para US4 y US6
- Al arrancar el servidor tras T008, TypeORM crearÃ¡ automÃ¡ticamente las tablas `sesion_caja` y `movimiento_caja` (synchronize: true)
- Verificar arranque del servidor despuÃ©s de cada fase foundational

