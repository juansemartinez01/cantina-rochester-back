# Quickstart: Validación del Módulo de Caja

**Feature**: 001-modulo-caja
**Date**: 2026-06-23

Guía para validar el módulo end-to-end una vez implementado.

---

## Prerrequisitos

- Servidor corriendo (`npm run start:dev`)
- PostgreSQL con las tablas sincronizadas (auto con `synchronize: true`)
- Token JWT válido de un usuario con rol `cajero` o `administrador`
- Al menos un `almacen` existente en la DB (id conocido, ej: `almacen_id = 1`)
- Un token adicional de usuario con rol `administrador` para probar anulaciones

---

## Flujo 1: Turno de caja completo (happy path)

### Paso 1 — Abrir caja

```http
POST /caja/abrir
Authorization: Bearer <token_cajero>
Content-Type: application/json

{
  "almacen_id": 1,
  "monto_inicial": 50000,
  "observacion": "Turno mañana"
}
```

**Verificar**:
- Respuesta `201` con `"estado": "ABIERTA"`
- Guardar el `id` de la sesión (ej: `caja_id = 42`)

### Paso 2 — Registrar un egreso manual

```http
POST /caja/42/movimiento
Authorization: Bearer <token_cajero>
Content-Type: application/json

{
  "tipo": "EGRESO",
  "monto": 5000,
  "motivo": "Compra de bolsas"
}
```

**Verificar**:
- Respuesta `201` con `"tipo": "EGRESO"`, `"anulado": false`

### Paso 3 — Registrar un retiro de efectivo

```http
POST /caja/42/movimiento
Authorization: Bearer <token_cajero>
Content-Type: application/json

{
  "tipo": "RETIRO",
  "monto": 40000,
  "motivo": "Retiro para administración"
}
```

**Verificar**: Respuesta `201` con `"tipo": "RETIRO"`

### Paso 4 — Consultar estado actual de la caja

```http
GET /caja/activa?almacen_id=1
Authorization: Bearer <token_cajero>
```

**Verificar** (asumiendo que hubo cobros de ventas en efectivo por $120.000 en el período):
- `cobros_efectivo` = `"120000.00"` (sumado de IngresoVenta existente)
- `egresos_manuales` = `"5000.00"`
- `retiros` = `"40000.00"`
- `efectivo_esperado` = `"125000.00"` (50000 + 120000 - 5000 - 40000)

### Paso 5 — Cerrar caja

```http
POST /caja/42/cerrar
Authorization: Bearer <token_cajero>
Content-Type: application/json

{
  "efectivo_contado": 123000
}
```

**Verificar** en el reporte de respuesta:
- `"efectivo_esperado": "125000.00"`
- `"efectivo_contado": "123000.00"`
- `"diferencia": "-2000.00"`
- `"estado": "CERRADA"`

---

## Flujo 2: Bloqueo de movimientos sobre caja cerrada

```http
POST /caja/42/movimiento
Authorization: Bearer <token_cajero>
Content-Type: application/json

{
  "tipo": "INGRESO",
  "monto": 1000,
  "motivo": "test"
}
```

**Verificar**: Respuesta `400` con mensaje de error indicando caja cerrada.

---

## Flujo 3: Prevenir doble apertura

```http
POST /caja/abrir
Authorization: Bearer <token_cajero>
Content-Type: application/json

{
  "almacen_id": 1,
  "monto_inicial": 10000
}
```

**Verificar**: Respuesta `400` — "Ya existe una caja abierta para este almacén".

---

## Flujo 4: Anulación de movimiento (admin)

Dado un movimiento con id `15` registrado previamente:

```http
PATCH /caja/movimiento/15/anular
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "motivo_anulacion": "Importe incorrecto"
}
```

**Verificar**:
- Respuesta `200` con `"anulado": true`
- Al consultar el reporte de la sesión, el movimiento anulado ya no suma al saldo

---

## Flujo 5: Motivo obligatorio

```http
POST /caja/42/movimiento
Authorization: Bearer <token_cajero>
Content-Type: application/json

{
  "tipo": "EGRESO",
  "monto": 1000
}
```

**Verificar**: Respuesta `400` por ValidationPipe — campo `motivo` requerido.

---

## Referencias

- Contrato de endpoints: [contracts/caja-api.md](contracts/caja-api.md)
- Modelo de datos: [data-model.md](data-model.md)
- Decisiones técnicas: [research.md](research.md)
