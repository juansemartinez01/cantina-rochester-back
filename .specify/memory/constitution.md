<!--
SYNC IMPACT REPORT
Version change: N/A → 1.0.0 (initial ratification)
Added sections: Core Principles, Stack & Constraints, Module Structure, Development Workflow, Governance
Templates requiring updates:
  ✅ plan-template.md — Constitution Check gate references these principles
  ✅ spec-template.md — no changes needed (generic)
  ✅ tasks-template.md — no changes needed (generic)
Follow-up TODOs: none
-->

# gestion-stock-backend — Constitution

## Core Principles

### I. Feature Module Isolation

Every new feature MUST live in its own NestJS module under `src/[feature]/`, with exactly these files:

- `[feature].module.ts` — declara imports, providers, controllers, exports
- `[feature].controller.ts` — rutas HTTP, DTOs de entrada/salida
- `[feature].service.ts` — lógica de negocio
- `[feature].entity.ts` — entidad TypeORM

Si la feature es pequeña y complementaria a otra existente (ej. historial de precios dentro de producto), puede vivir como sub-carpeta pero DEBE tener su propio Module exportable.

Rationale: Los 22 módulos existentes siguen este patrón sin excepción. Mantenerlo garantiza coherencia y facilita el onboarding.

### II. JWT Global — @Public() como excepción

El `JwtAuthGuard` está aplicado globalmente en `main.ts`. Toda ruta nueva está protegida por JWT por defecto.
Para rutas que no requieren autenticación (login, registro), se DEBE usar el decorador `@Public()`.

NUNCA deshabilitar el guard global. NUNCA omitir autenticación en rutas que manejan datos del negocio.

Rationale: Patrón establecido en `src/auth/jwt-auth.guard.ts`. Cambiar el guard global rompería todo el sistema.

### III. TypeORM con synchronize (sin migraciones manuales)

La base de datos se sincroniza automáticamente con las entidades (`synchronize: true`). No se usan archivos de migración en el flujo activo.

Para modificar el esquema: modificar la entidad TypeORM directamente. El schema se actualiza al reiniciar.

NUNCA ejecutar SQL crudo para DDL. NUNCA agregar columnas fuera de la entidad.

Rationale: `migrationsRun: false` y `synchronize: true` en `app.module.ts`. El proyecto usa Railway para deploy; las entidades son la fuente de verdad.

### IV. Validación de Entrada con DTOs + class-validator

Todo input de usuario en controllers DEBE validarse con un DTO decorado con `class-validator`.
El `ValidationPipe` está activo globalmente (configurado en `main.ts`).

- `@IsString()`, `@IsNumber()`, `@IsOptional()`, etc. en cada campo del DTO
- No validar en el service — esa responsabilidad es del controller/pipe
- Transformar con `@Type()` de class-transformer cuando sea necesario

### V. Sin tests (por ahora)

El proyecto actualmente no tiene test unitarios ni e2e activos. No agregar tests como parte de implementación de features a menos que el usuario lo solicite explícitamente.

Rationale: El proyecto prioriza velocidad de iteración sobre cobertura de tests. Esta decisión puede revisarse en el futuro.

### VI. CORS fijo — no modificar sin coordinación

Los orígenes permitidos están hardcodeados en `main.ts`. Al agregar un nuevo frontend o dominio, actualizar esa lista explícitamente.

No usar `origin: true` (permite todos los orígenes) en producción.

---

## Stack & Constraints

**Lenguaje**: TypeScript 5.8.3
**Framework**: NestJS 11.0.1
**Base de datos**: PostgreSQL (via TypeORM 0.3.23)
**Autenticación**: JWT (passport-jwt) + local strategy (passport-local)
**Validación**: class-validator + class-transformer (ValidationPipe global)
**Deploy**: Railway (producción), `process.env.PORT ?? 3000`
**SSL DB**: condicional — `DB_SSL=true` activa SSL sin rejectUnauthorized

**Variables de entorno requeridas**: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_SSL`, `JWT_SECRET`

**Restricciones clave**:
- `synchronize: true` — no agregar columnas NOT NULL sin default en entidades existentes con datos
- El guard JWT es global — toda excepción pública requiere `@Public()`
- CORS lista blanca — cambios coordinados con el frontend

---

## Module Structure

Patrón canónico de módulo (seguir exactamente):

```
src/
└── [feature]/
    ├── [feature].module.ts
    ├── [feature].controller.ts
    ├── [feature].service.ts
    ├── [feature].entity.ts
    └── dto/                        ← opcional, si hay múltiples DTOs
        ├── create-[feature].dto.ts
        └── update-[feature].dto.ts
```

**Módulos existentes** (no duplicar funcionalidad):
`auth`, `usuario`, `role`, `usuario-rol`, `producto`, `stock-actual`, `almacen`,
`movimiento-stock`, `categoria`, `unidad`, `parametro-reorden`, `orden-compra`,
`proveedor`, `venta`, `factura`, `ingreso`, `promocion`, `gastos`, `extraccion`,
`producto-precio-almacen`, `producto-precio-historial`

---

## Development Workflow

Para cada nueva feature con spec-kit:

1. `/speckit-specify` — definir qué hace la feature (sin detalles técnicos)
2. `/speckit-plan` — plan técnico (módulo nuevo vs extensión de existente, entidades, endpoints)
3. `/speckit-tasks` — tareas ordenadas
4. `/speckit-implement` — implementación módulo por módulo

Al implementar, registrar el módulo nuevo en `src/app.module.ts` imports array.

---

## Governance

Esta constitución es la fuente de verdad para decisiones de arquitectura en este proyecto.
Cualquier desviación de los principios DEBE estar justificada en el `plan.md` de la feature bajo "Complexity Tracking".

Proceso de enmienda: editar este archivo y actualizar la versión + fecha.

**Version**: 1.0.0 | **Ratified**: 2026-06-23 | **Last Amended**: 2026-06-23
