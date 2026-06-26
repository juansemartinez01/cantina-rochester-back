# API Contracts: Módulo de Caja

**Base path**: `/caja`
**Auth**: JWT requerido en todos los endpoints (guard global)
**Date**: 2026-06-23

---

## POST /caja/abrir

Abre una nueva sesión de caja para un almacén.

**Auth**: Cajero o Administrador

**Request Body**:
```json
{
  "almacen_id": 1,
  "monto_inicial": 50000,
  "observacion": "Turno mañana - fondo inicial"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `almacen_id` | number | Sí | Debe existir en la tabla almacen |
| `monto_inicial` | number | Sí | >= 0 |
| `observacion` | string | No | max 500 chars |

**Response 201**:
```json
{
  "id": 42,
  "almacen_id": 1,
  "usuario_id": 7,
  "monto_inicial": "50000.00",
  "estado": "ABIERTA",
  "observacion": "Turno mañana - fondo inicial",
  "fecha_apertura": "2026-06-23T08:00:00.000Z"
}
```

**Errores**:
| Código | Causa |
|--------|-------|
| 400 | Ya existe una caja ABIERTA para ese almacén |
| 404 | almacen_id no existe |

---

## GET /caja/activa

Retorna la sesión de caja actualmente ABIERTA para un almacén.

**Auth**: Cajero o Administrador
**Query params**: `?almacen_id=1`

**Response 200**:
```json
{
  "id": 42,
  "almacen_id": 1,
  "usuario_id": 7,
  "monto_inicial": "50000.00",
  "estado": "ABIERTA",
  "fecha_apertura": "2026-06-23T08:00:00.000Z",
  "resumen_parcial": {
    "cobros_efectivo": "120000.00",
    "cobros_bancarizado": "35000.00",
    "ingresos_manuales": "0.00",
    "egresos_manuales": "5000.00",
    "retiros": "40000.00",
    "efectivo_esperado": "125000.00"
  }
}
```

**Errores**:
| Código | Causa |
|--------|-------|
| 404 | No hay caja abierta para ese almacén |

---

## POST /caja/:id/movimiento

Registra un movimiento manual (ingreso, egreso o retiro de efectivo) en la sesión.

**Auth**: Cajero o Administrador

**Request Body**:
```json
{
  "tipo": "EGRESO",
  "monto": 5000,
  "motivo": "Compra de bolsas de empaque",
  "observacion": "Pago al proveedor Martínez"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `tipo` | enum | Sí | INGRESO \| EGRESO \| RETIRO |
| `monto` | number | Sí | > 0 |
| `motivo` | string | Sí | min 3 chars, max 500 chars |
| `observacion` | string | No | max 500 chars |

**Response 201**:
```json
{
  "id": 15,
  "caja_id": 42,
  "tipo": "EGRESO",
  "monto": "5000.00",
  "motivo": "Compra de bolsas de empaque",
  "observacion": "Pago al proveedor Martínez",
  "usuario_id": 7,
  "fecha": "2026-06-23T10:30:00.000Z",
  "anulado": false
}
```

**Errores**:
| Código | Causa |
|--------|-------|
| 400 | La sesión está CERRADA |
| 400 | motivo vacío o ausente |
| 404 | Sesión no existe |

---

## POST /caja/:id/cerrar

Registra el efectivo contado y cierra la sesión.

**Auth**: Cajero o Administrador

**Request Body**:
```json
{
  "efectivo_contado": 123000
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `efectivo_contado` | number | Sí | >= 0 |

**Response 200** (reporte de cierre):
```json
{
  "id": 42,
  "estado": "CERRADA",
  "fecha_apertura": "2026-06-23T08:00:00.000Z",
  "fecha_cierre": "2026-06-23T20:00:00.000Z",
  "usuario_id": 7,
  "almacen_id": 1,
  "reporte": {
    "monto_inicial": "50000.00",
    "cobros_efectivo": "120000.00",
    "cobros_bancarizado": "35000.00",
    "ingresos_manuales": "0.00",
    "egresos_manuales": "5000.00",
    "retiros": "40000.00",
    "efectivo_esperado": "125000.00",
    "efectivo_contado": "123000.00",
    "diferencia": "-2000.00"
  }
}
```

**Errores**:
| Código | Causa |
|--------|-------|
| 400 | La sesión ya está CERRADA |
| 404 | Sesión no existe |

---

## GET /caja/:id/reporte

Retorna el reporte de cierre de una sesión (solo sesiones CERRADAS o la activa).

**Auth**: Cajero o Administrador

**Response 200**: Igual que la respuesta de `POST /caja/:id/cerrar`.

---

## PATCH /caja/movimiento/:id/anular

Anula un movimiento manual. Solo para administradores.

**Auth**: Administrador

**Request Body**:
```json
{
  "motivo_anulacion": "Importe incorrecto, se cargó $5000 en vez de $500"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `motivo_anulacion` | string | Sí | min 5 chars, max 500 chars |

**Response 200**:
```json
{
  "id": 15,
  "anulado": true,
  "motivo_anulacion": "Importe incorrecto, se cargó $5000 en vez de $500",
  "anulado_por_id": 3,
  "fecha_anulacion": "2026-06-23T11:00:00.000Z"
}
```

**Errores**:
| Código | Causa |
|--------|-------|
| 400 | El movimiento ya está anulado |
| 400 | motivo_anulacion vacío o ausente |
| 404 | Movimiento no existe |

---

## GET /caja/historial

Lista sesiones de caja (todas o filtradas). Solo administradores.

**Auth**: Administrador
**Query params**: `?almacen_id=1&desde=2026-06-01&hasta=2026-06-30&page=1&limit=20`

**Response 200**:
```json
{
  "data": [
    {
      "id": 42,
      "almacen_id": 1,
      "usuario_id": 7,
      "estado": "CERRADA",
      "monto_inicial": "50000.00",
      "diferencia": "-2000.00",
      "fecha_apertura": "2026-06-23T08:00:00.000Z",
      "fecha_cierre": "2026-06-23T20:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```
