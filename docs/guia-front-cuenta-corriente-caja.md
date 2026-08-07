# Guia para Frontend: cuentas corrientes y caja

Esta guia documenta el cambio aplicado al flujo de ventas a cuenta corriente y los endpoints que el frontend debe usar o considerar.

## Resumen del cambio

Antes, una venta a cuenta corriente sin pago inicial podia registrarse aunque no hubiera caja abierta y no dejaba rastro en `movimiento_caja`.

Ahora:

- Toda venta a cuenta corriente requiere una caja abierta para el `almacenId` de la venta.
- Toda venta a cuenta corriente crea un movimiento de caja informativo.
- Ese movimiento informativo tiene `monto = 0`, `origen = CUENTA_CORRIENTE` y `tipo = INGRESO`.
- Si la venta tiene pago inicial, el pago real sigue registrandose como `ingreso_venta`.
- El movimiento informativo de cuenta corriente no debe sumar plata a caja.
- Los cobros posteriores de cuenta corriente siguen creando movimientos reales de caja con el monto cobrado.
- Los movimientos de caja con `origen = CUENTA_CORRIENTE` no se pueden anular desde caja.

## Conceptos importantes

### Venta contado

Una venta contado usa `tipoCobro = CONTADO` o no envia `tipoCobro`.

Debe enviar pagos por el total exacto de la venta. El backend recalcula precios y totales, por lo que la suma de `pagos[].monto` debe coincidir con el total calculado.

Los pagos se guardan en `ingreso_venta` y aparecen en caja dentro de `cobros_ventas`.

### Venta a cuenta corriente

Una venta a cuenta corriente usa `tipoCobro = CUENTA_CORRIENTE` y debe enviar `cuentaCorrienteId`.

Puede enviarse:

- Sin pagos: genera deuda completa.
- Con pago inicial parcial: genera deuda por el pendiente.
- Con pago inicial total: la venta queda pagada en la cuenta corriente, pero igual queda trazada como venta a cuenta corriente.

Reglas:

- Debe existir una caja abierta para el `almacenId`.
- `cuentaCorrienteId` es obligatorio.
- La cuenta corriente debe existir y estar activa.
- Los pagos iniciales no pueden superar el total de la venta.
- Si `pagos` esta vacio, debe enviarse `pagos: []`.

Al registrar la venta, el backend crea:

- `venta`
- `venta_item`
- `cuenta_corriente_venta`
- `cuenta_corriente_movimiento` tipo `DEUDA`
- Si hubo pago inicial: `cuenta_corriente_pago`, aplicaciones y movimiento tipo `PAGO`
- Siempre: `movimiento_caja` informativo con `monto = 0`
- Si hubo pago inicial: `ingreso_venta` con el pago real

## Metodos de pago

Valores validos:

```ts
EFECTIVO
TRANSFERENCIA
QR
DEBITO
CREDITO
OTRO
```

Para `OTRO`, `detalle_pago` es obligatorio y debe tener entre 3 y 120 caracteres.

Aliases aceptados por backend en algunos endpoints:

- `CASH` -> `EFECTIVO`
- `TRANSFER`, `TRANSFERENCIAS` -> `TRANSFERENCIA`
- `QR` -> `QR`
- `DEBIT` -> `DEBITO`
- `CREDIT` -> `CREDITO`
- `QR_EXTERNO`, `MERCADO_PAGO`, `MP`, `CHEQUE`, `GIFT_CARD` -> `OTRO`

Recomendacion para front: enviar siempre los valores canonicos.

## Flujo recomendado de venta a cuenta corriente

1. Verificar caja abierta:

```http
GET /caja/activa?almacen_id=1
```

2. Si no hay caja abierta, bloquear la venta y pedir apertura de caja.

3. Seleccionar o crear cuenta corriente.

4. Enviar venta:

```http
POST /ventas
```

5. Luego de confirmar, refrescar:

- Caja activa: `GET /caja/activa?almacen_id=1`
- Resumen de cuenta: `GET /cuentas-corrientes/:id/resumen`
- Movimientos de caja si se muestra grilla: `GET /caja/:id/movimientos?origen=CUENTA_CORRIENTE`

## Endpoint: abrir caja

```http
POST /caja/abrir
Authorization: Bearer <token>
```

Body:

```json
{
  "almacen_id": 1,
  "monto_inicial": 1000,
  "observacion": "Apertura turno manana"
}
```

Campos:

- `almacen_id`: number obligatorio.
- `monto_inicial`: number obligatorio, minimo 0.
- `observacion`: string opcional, maximo 500.

Response ejemplo:

```json
{
  "id": 12,
  "almacen_id": 1,
  "usuario_id": 1,
  "monto_inicial": "1000.00",
  "estado": "ABIERTA",
  "observacion": "Apertura turno manana",
  "fecha_apertura": "2026-07-31T21:32:34.517Z",
  "fecha_cierre": null,
  "efectivo_contado": null,
  "diferencia": null
}
```

Error si ya hay caja abierta:

```json
{
  "message": "Ya existe una caja abierta para el almacen 1 (sesion #12)",
  "error": "Bad Request",
  "statusCode": 400
}
```

## Endpoint: caja activa

```http
GET /caja/activa?almacen_id=1
Authorization: Bearer <token>
```

Query params:

- `almacen_id`: number obligatorio.

Response ejemplo:

```json
{
  "id": 12,
  "almacen_id": 1,
  "usuario_id": 1,
  "monto_inicial": "1000.00",
  "estado": "ABIERTA",
  "observacion": "Apertura turno manana",
  "fecha_apertura": "2026-07-31T21:32:34.517Z",
  "resumen_parcial": {
    "cobros_efectivo": "5550.00",
    "cobros_bancarizado": "11100.00",
    "cobros_otro": "3700.00",
    "cobros_por_metodo": {
      "EFECTIVO": "5550.00",
      "TRANSFERENCIA": "3700.00",
      "QR": "0.00",
      "DEBITO": "3700.00",
      "CREDITO": "3700.00",
      "OTRO": "3700.00",
      "BANCARIZADO_LEGACY": "0.00"
    },
    "cobros_ventas": {
      "efectivo": "5550.00",
      "transferencia": "3700.00",
      "qr": "0.00",
      "debito": "3700.00",
      "credito": "3700.00",
      "otro": "3700.00",
      "bancarizadoLegacy": "0.00",
      "bancarizado": "11100.00",
      "total": "20350.00"
    },
    "cobros_cuenta_corriente": {
      "efectivo": "0.00",
      "transferencia": "3700.00",
      "qr": "0.00",
      "debito": "0.00",
      "credito": "0.00",
      "otro": "0.00",
      "bancarizadoLegacy": "0.00",
      "bancarizado": "3700.00",
      "total": "3700.00"
    },
    "movimientos_manuales": {
      "ingresos": {
        "efectivo": "0.00",
        "transferencia": "0.00",
        "debito": "0.00",
        "credito": "0.00",
        "otro": "0.00",
        "bancarizadoLegacy": "0.00",
        "bancarizado": "0.00",
        "total": "0.00"
      },
      "egresos": {
        "efectivo": "0.00",
        "transferencia": "0.00",
        "debito": "0.00",
        "credito": "0.00",
        "otro": "0.00",
        "bancarizadoLegacy": "0.00",
        "bancarizado": "0.00",
        "total": "0.00"
      },
      "retiros": {
        "efectivo": "0.00",
        "transferencia": "0.00",
        "debito": "0.00",
        "credito": "0.00",
        "otro": "0.00",
        "bancarizadoLegacy": "0.00",
        "bancarizado": "0.00",
        "total": "0.00"
      }
    },
    "ingresos_manuales": "0.00",
    "ingresos_manuales_bancarizado": "0.00",
    "ingresos_manuales_otro": "0.00",
    "egresos_manuales": "0.00",
    "retiros": "0.00",
    "efectivo_esperado": "6550.00"
  }
}
```

Error si no hay caja abierta:

```json
{
  "message": "No hay caja abierta para el almacen 1",
  "error": "Not Found",
  "statusCode": 404
}
```

## Endpoint: registrar venta contado

```http
POST /ventas
Authorization: Bearer <token>
```

Body contado simple:

```json
{
  "usuarioId": 1,
  "almacenId": 1,
  "tipoCobro": "CONTADO",
  "items": [
    {
      "productoId": 2,
      "cantidad": 1
    }
  ],
  "pagos": [
    {
      "medio": "EFECTIVO",
      "monto": 3700
    }
  ]
}
```

Body contado con pago `OTRO`:

```json
{
  "usuarioId": 1,
  "almacenId": 1,
  "tipoCobro": "CONTADO",
  "items": [
    {
      "productoId": 2,
      "cantidad": 1
    }
  ],
  "pagos": [
    {
      "medio": "OTRO",
      "monto": 3700,
      "detalle_pago": "Mercado Pago"
    }
  ]
}
```

Body contado con pagos mixtos:

```json
{
  "usuarioId": 1,
  "almacenId": 1,
  "tipoCobro": "CONTADO",
  "items": [
    {
      "productoId": 2,
      "cantidad": 1
    }
  ],
  "pagos": [
    {
      "medio": "EFECTIVO",
      "monto": 1000
    },
    {
      "medio": "TRANSFERENCIA",
      "monto": 2700
    }
  ]
}
```

Reglas contado:

- `tipoCobro` puede omitirse; el default es `CONTADO`.
- `cuentaCorrienteId` no debe enviarse en contado.
- `pagos` debe tener al menos un pago si el total es mayor a 0.
- La suma de pagos debe coincidir con el total calculado por backend.

## Endpoint: registrar venta a cuenta corriente sin pago inicial

```http
POST /ventas
Authorization: Bearer <token>
```

Body:

```json
{
  "usuarioId": 1,
  "almacenId": 1,
  "tipoCobro": "CUENTA_CORRIENTE",
  "cuentaCorrienteId": 15,
  "items": [
    {
      "productoId": 2,
      "cantidad": 1
    }
  ],
  "pagos": []
}
```

Resultado interno:

- Crea venta confirmada.
- Crea deuda por el total.
- Crea `cuenta_corriente_venta` con:
  - `montoOriginal = total`
  - `montoPagado = 0`
  - `montoPendiente = total`
  - `estado = PENDIENTE`
- Crea `movimiento_caja` informativo:
  - `tipo = INGRESO`
  - `monto = 0`
  - `medio_pago = EFECTIVO`
  - `origen = CUENTA_CORRIENTE`
  - `cuenta_corriente_pago_id = null`
  - `motivo = Venta a cuenta corriente #<ventaId> - <nombreCuenta>`
  - `observacion = Deuda generada: <total> | Pagado inicial: 0.00 | Pendiente: <total>`

Error si no hay caja abierta:

```json
{
  "message": "No hay caja abierta para el almacen 1",
  "error": "Bad Request",
  "statusCode": 400
}
```

Nota para UX: si el usuario intenta vender a cuenta corriente y no hay caja abierta, mostrar un mensaje accionable: "Para vender a cuenta corriente primero tenes que abrir caja".

## Endpoint: registrar venta a cuenta corriente con pago inicial

```http
POST /ventas
Authorization: Bearer <token>
```

Body:

```json
{
  "usuarioId": 1,
  "almacenId": 1,
  "tipoCobro": "CUENTA_CORRIENTE",
  "cuentaCorrienteId": 15,
  "items": [
    {
      "productoId": 2,
      "cantidad": 1
    }
  ],
  "pagos": [
    {
      "medio": "EFECTIVO",
      "monto": 1850
    }
  ]
}
```

Resultado interno si el total era 3700:

- La venta queda confirmada con total 3700.
- La cuenta corriente recibe deuda por 3700.
- El pago inicial descuenta 1850.
- La cuenta queda con saldo pendiente 1850.
- `cuenta_corriente_venta` queda:
  - `montoOriginal = 3700`
  - `montoPagado = 1850`
  - `montoPendiente = 1850`
  - `estado = PARCIAL`
- Se crea `ingreso_venta` por 1850 con el metodo enviado.
- Se crea `movimiento_caja` informativo con `monto = 0`.

Movimiento informativo esperado:

```json
{
  "tipo": "INGRESO",
  "medio_pago": "EFECTIVO",
  "origen": "CUENTA_CORRIENTE",
  "cuenta_corriente_pago_id": null,
  "monto": "0.00",
  "motivo": "Venta a cuenta corriente #123 - Cliente Test",
  "observacion": "Deuda generada: 3700.00 | Pagado inicial: 1850.00 | Pendiente: 1850.00",
  "anulado": false
}
```

Regla importante: el pago inicial no crea `movimiento_caja` real de cuenta corriente. En caja aparece dentro de `cobros_ventas`, porque se registra como `ingreso_venta`.

## Response de `POST /ventas`

El endpoint devuelve la venta completa (`getVentaCompleta`).

Ejemplo abreviado:

```json
{
  "id": 123,
  "fecha": "2026-07-31T21:32:38.220Z",
  "subtotal": "3700.00",
  "totalDescuentos": "0.00",
  "totalRecargos": "0.00",
  "total": "3700.00",
  "estado": "CONFIRMADA",
  "tipoCobro": "CUENTA_CORRIENTE",
  "cuentaCorrienteId": 15,
  "usuario": {
    "id": 1,
    "nombre": "Admin"
  },
  "almacen": {
    "id": 1,
    "nombre": "Almacen Principal"
  },
  "items": [
    {
      "id": 999,
      "cantidad": 1,
      "cantidad_gramos": null,
      "precioUnitario": "3700.00",
      "subtotal": "3700.00",
      "producto": {
        "id": 2,
        "sku": "UCC-0001",
        "nombre": "AGUA CON GAS BONAQUA X 500 ML"
      }
    }
  ],
  "ingresos": [
    {
      "id": 88,
      "tipo": "EFECTIVO",
      "monto": "1850.00",
      "detalle_pago": null,
      "fecha": "2026-07-31T21:32:38.400Z"
    }
  ],
  "ajustes": []
}
```

En una cuenta corriente sin pago inicial, `ingresos` viene vacio.

## Endpoint: listar cuentas corrientes

```http
GET /cuentas-corrientes?search=juan&activa=true&page=1&limit=50&orderBy=nombre&order=ASC
Authorization: Bearer <token>
```

Query params:

- `search`: busca por nombre, documento o email.
- `documento`: filtro por documento.
- `activa`: `true` o `false`.
- `page`: default 1.
- `limit`: default 50, maximo 200.
- `orderBy`: `nombre`, `saldoActual`, `createdAt`.
- `order`: `ASC` o `DESC`.

Response:

```json
{
  "data": [
    {
      "id": 15,
      "nombre": "Cliente Test",
      "documento": "30111222",
      "email": "cliente@test.com",
      "telefono": "3410000000",
      "activa": true,
      "saldoActual": "1850.00",
      "observaciones": null,
      "createdAt": "2026-07-31T21:32:35.326Z",
      "updatedAt": "2026-07-31T21:32:39.600Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "totalPages": 1
  }
}
```

## Endpoint: crear cuenta corriente

```http
POST /cuentas-corrientes
Authorization: Bearer <token>
```

Body:

```json
{
  "nombre": "Cliente Test",
  "documento": "30111222",
  "email": "cliente@test.com",
  "telefono": "3410000000",
  "observaciones": "Cliente frecuente"
}
```

Campos:

- `nombre`: obligatorio, maximo 255.
- `documento`: opcional, maximo 50. Si se envia y ya existe en otra cuenta, devuelve conflicto.
- `email`: opcional, email valido, maximo 255.
- `telefono`: opcional, maximo 50.
- `observaciones`: opcional.

Response:

```json
{
  "id": 15,
  "nombre": "Cliente Test",
  "documento": "30111222",
  "email": "cliente@test.com",
  "telefono": "3410000000",
  "activa": true,
  "saldoActual": 0,
  "observaciones": "Cliente frecuente",
  "createdAt": "2026-07-31T21:32:35.326Z",
  "updatedAt": "2026-07-31T21:32:35.326Z"
}
```

Error por documento repetido:

```json
{
  "message": "Ya existe una cuenta corriente con documento \"30111222\"",
  "error": "Conflict",
  "statusCode": 409
}
```

## Endpoint: actualizar cuenta corriente

```http
PATCH /cuentas-corrientes/:id
Authorization: Bearer <token>
```

Body:

```json
{
  "nombre": "Cliente Test Editado",
  "documento": "30111222",
  "email": "cliente.editado@test.com",
  "telefono": "3411111111",
  "observaciones": "Nueva observacion",
  "activa": true
}
```

Todos los campos son opcionales. Si se envia un string vacio para `documento`, `email`, `telefono` u `observaciones`, se normaliza a `null`.

## Endpoint: obtener resumen de cuenta corriente

```http
GET /cuentas-corrientes/:id/resumen
Authorization: Bearer <token>
```

Response:

```json
{
  "cuenta": {
    "id": 15,
    "nombre": "Cliente Test",
    "documento": "30111222",
    "email": null,
    "telefono": null,
    "activa": true,
    "saldoActual": "1850.00",
    "observaciones": null,
    "createdAt": "2026-07-31T21:32:35.326Z",
    "updatedAt": "2026-07-31T21:32:39.600Z"
  },
  "saldoActual": 1850,
  "ventas": {
    "cantidad": 2,
    "montoOriginal": 7400,
    "montoPagado": 5550,
    "montoPendiente": 1850,
    "estados": {
      "PARCIAL": 1,
      "PAGADA": 1
    }
  },
  "pagos": {
    "cantidad": 2,
    "total": 5550
  },
  "movimientos": {
    "cantidad": 4,
    "ultimo": {
      "id": 44,
      "cuentaCorrienteId": 15,
      "tipo": "PAGO",
      "ventaId": null,
      "pagoId": 22,
      "monto": "3700.00",
      "saldoResultante": "1850.00",
      "descripcion": "Pago cuenta corriente",
      "usuarioId": 1,
      "fecha": "2026-07-31T21:32:39.600Z"
    }
  }
}
```

Interpretacion:

- `saldoActual > 0`: el cliente debe plata.
- `saldoActual = 0`: cuenta saldada.
- `saldoActual < 0`: saldo a favor del cliente.

## Endpoint: listar ventas de una cuenta corriente

```http
GET /cuentas-corrientes/:id/ventas?page=1&limit=50&order=DESC
Authorization: Bearer <token>
```

Query params:

- `page`: default 1.
- `limit`: default 50, maximo 200.
- `order`: `ASC` o `DESC`, default `DESC`.

Response:

```json
{
  "data": [
    {
      "id": 31,
      "cuentaCorrienteId": 15,
      "ventaId": 123,
      "montoOriginal": "3700.00",
      "montoPagado": "1850.00",
      "montoPendiente": "1850.00",
      "estado": "PARCIAL",
      "fecha": "2026-07-31T21:32:38.220Z",
      "venta": {
        "id": 123,
        "fecha": "2026-07-31T21:32:38.220Z",
        "total": "3700.00",
        "estado": "CONFIRMADA",
        "tipoCobro": "CUENTA_CORRIENTE",
        "items": []
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "totalPages": 1
  }
}
```

Estados posibles de `cuenta_corriente_venta`:

```ts
PENDIENTE
PARCIAL
PAGADA
ANULADA
```

## Endpoint: listar movimientos de una cuenta corriente

```http
GET /cuentas-corrientes/:id/movimientos?page=1&limit=50&order=DESC
Authorization: Bearer <token>
```

Response:

```json
{
  "data": [
    {
      "id": 44,
      "cuentaCorrienteId": 15,
      "tipo": "PAGO",
      "ventaId": null,
      "pagoId": 22,
      "monto": "3700.00",
      "saldoResultante": "1850.00",
      "descripcion": "Pago cuenta corriente",
      "usuarioId": 1,
      "fecha": "2026-07-31T21:32:39.600Z",
      "venta": null,
      "pago": {
        "id": 22,
        "monto": "3700.00",
        "medioPago": "TRANSFERENCIA"
      },
      "usuario": {
        "id": 1,
        "nombre": "Admin"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "totalPages": 1
  }
}
```

Tipos posibles:

```ts
DEUDA
PAGO
AJUSTE_DEBITO
AJUSTE_CREDITO
SALDO_A_FAVOR
```

## Endpoint: registrar pago posterior de cuenta corriente

```http
POST /cuentas-corrientes/:id/pagos
Authorization: Bearer <token>
```

Body:

```json
{
  "almacenId": 1,
  "monto": 3700,
  "medioPago": "TRANSFERENCIA",
  "referencia": "Transferencia comprobante 123",
  "observacion": "Pago parcial de deuda"
}
```

Body con `OTRO`:

```json
{
  "almacenId": 1,
  "monto": 3700,
  "medioPago": "OTRO",
  "detalle_pago": "Mercado Pago",
  "referencia": "Operacion MP 123",
  "observacion": "Pago por MP"
}
```

Campos:

- `almacenId`: obligatorio. Debe tener caja abierta.
- `monto`: obligatorio, minimo 0.01.
- `medioPago`: obligatorio. Valores: `EFECTIVO`, `TRANSFERENCIA`, `QR`, `DEBITO`, `CREDITO`, `OTRO`.
- `detalle_pago`: obligatorio solo para `OTRO`.
- `referencia`: opcional, maximo 120.
- `observacion`: opcional, maximo 500.

Response:

```json
{
  "pago": {
    "id": 22,
    "cuentaCorrienteId": 15,
    "almacenId": 1,
    "monto": 3700,
    "medioPago": "TRANSFERENCIA",
    "detallePago": null,
    "referencia": "Transferencia comprobante 123",
    "observacion": "Pago parcial de deuda",
    "usuarioId": 1,
    "fecha": "2026-07-31T21:32:39.600Z"
  },
  "aplicaciones": [
    {
      "id": 77,
      "pagoId": 22,
      "cuentaCorrienteVentaId": 31,
      "montoAplicado": 3700,
      "fecha": "2026-07-31T21:32:39.600Z"
    }
  ],
  "movimiento": {
    "id": 44,
    "cuentaCorrienteId": 15,
    "tipo": "PAGO",
    "ventaId": null,
    "pagoId": 22,
    "monto": 3700,
    "saldoResultante": 1850,
    "descripcion": "Pago cuenta corriente",
    "usuarioId": 1,
    "fecha": "2026-07-31T21:32:39.600Z"
  },
  "movimientoCaja": {
    "id": 90,
    "caja_id": 12,
    "tipo": "INGRESO",
    "monto": 3700,
    "medio_pago": "TRANSFERENCIA",
    "detalle_pago": null,
    "origen": "CUENTA_CORRIENTE",
    "cuenta_corriente_pago_id": 22,
    "motivo": "Cobro cuenta corriente #15 - Cliente Test",
    "observacion": "Pago parcial de deuda",
    "usuario_id": 1,
    "anulado": false,
    "fecha": "2026-07-31T21:32:39.600Z"
  },
  "saldoActual": 1850,
  "saldoAFavorGenerado": 0
}
```

Reglas:

- Este endpoint siempre requiere caja abierta.
- El pago se aplica automaticamente a las ventas pendientes mas antiguas.
- Si el pago supera la deuda pendiente, se genera saldo a favor (`saldoAFavorGenerado > 0`) y `saldoActual` puede quedar negativo.
- A diferencia del movimiento informativo de venta a cuenta corriente, este `movimientoCaja` si tiene monto real y debe contar en caja.

Error sin caja abierta:

```json
{
  "message": "No hay caja abierta para el almacen 1",
  "error": "Bad Request",
  "statusCode": 400
}
```

## Endpoint: ajuste manual de cuenta corriente

```http
POST /cuentas-corrientes/:id/ajustes
Authorization: Bearer <token>
```

Body:

```json
{
  "tipo": "AJUSTE_DEBITO",
  "monto": 500,
  "descripcion": "Ajuste por diferencia"
}
```

Tipos:

- `AJUSTE_DEBITO`: aumenta la deuda.
- `AJUSTE_CREDITO`: reduce la deuda o genera saldo a favor.

Response abreviada:

```json
{
  "cuenta": {
    "id": 15,
    "saldoActual": "2350.00"
  },
  "movimiento": {
    "id": 45,
    "cuentaCorrienteId": 15,
    "tipo": "AJUSTE_DEBITO",
    "monto": 500,
    "saldoResultante": 2350,
    "descripcion": "Ajuste por diferencia",
    "usuarioId": 1
  },
  "saldoActual": 2350
}
```

Nota: los ajustes de cuenta corriente no generan movimientos de caja.

## Endpoint: movimientos de caja

```http
GET /caja/:id/movimientos?origen=CUENTA_CORRIENTE&tipo=INGRESO&medio_pago=EFECTIVO&page=1&limit=50&order=DESC
Authorization: Bearer <token>
```

Query params:

- `origen`: `MANUAL` o `CUENTA_CORRIENTE`.
- `tipo`: `INGRESO`, `EGRESO`, `RETIRO`.
- `medio_pago`: `EFECTIVO`, `TRANSFERENCIA`, `QR`, `DEBITO`, `CREDITO`, `OTRO`, `BANCARIZADO`.
- `page`: default 1.
- `limit`: default 50, maximo 200.
- `order`: `ASC` o `DESC`, default `DESC`.

Response:

```json
{
  "data": [
    {
      "id": 90,
      "caja_id": 12,
      "tipo": "INGRESO",
      "monto": "0.00",
      "medio_pago": "EFECTIVO",
      "detalle_pago": null,
      "origen": "CUENTA_CORRIENTE",
      "cuenta_corriente_pago_id": null,
      "motivo": "Venta a cuenta corriente #123 - Cliente Test",
      "observacion": "Deuda generada: 3700.00 | Pagado inicial: 0.00 | Pendiente: 3700.00",
      "usuario_id": 1,
      "fecha": "2026-07-31T21:32:38.400Z",
      "anulado": false,
      "motivo_anulacion": null,
      "anulado_por_id": null,
      "fecha_anulacion": null,
      "cuentaCorrientePago": null
    },
    {
      "id": 91,
      "caja_id": 12,
      "tipo": "INGRESO",
      "monto": "3700.00",
      "medio_pago": "TRANSFERENCIA",
      "detalle_pago": null,
      "origen": "CUENTA_CORRIENTE",
      "cuenta_corriente_pago_id": 22,
      "motivo": "Cobro cuenta corriente #15 - Cliente Test",
      "observacion": "Pago parcial de deuda",
      "usuario_id": 1,
      "fecha": "2026-07-31T21:32:39.600Z",
      "anulado": false,
      "cuentaCorrientePago": {
        "id": 22,
        "cuentaCorrienteId": 15,
        "monto": "3700.00",
        "medioPago": "TRANSFERENCIA",
        "cuentaCorriente": {
          "id": 15,
          "nombre": "Cliente Test"
        }
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 2,
    "totalPages": 1
  }
}
```

Como distinguir movimientos:

- Venta a cuenta corriente informativa:
  - `origen = CUENTA_CORRIENTE`
  - `cuenta_corriente_pago_id = null`
  - `monto = 0`
  - No suma caja.
- Cobro posterior de cuenta corriente:
  - `origen = CUENTA_CORRIENTE`
  - `cuenta_corriente_pago_id != null`
  - `monto > 0`
  - Si suma caja.
- Movimiento manual:
  - `origen = MANUAL`

Recomendacion de UI:

- Mostrar los movimientos informativos con etiqueta "Cuenta corriente - deuda generada".
- No incluirlos en totales visuales propios si el front calcula totales localmente.
- Usar el reporte de caja del backend como fuente de verdad.

## Endpoint: reporte de caja

```http
GET /caja/:id/reporte
Authorization: Bearer <token>
```

Response:

```json
{
  "id": 12,
  "estado": "ABIERTA",
  "almacen_id": 1,
  "usuario_id": 1,
  "fecha_apertura": "2026-07-31T21:32:34.517Z",
  "fecha_cierre": null,
  "reporte": {
    "monto_inicial": "1000.00",
    "cobros_efectivo": "5550.00",
    "cobros_bancarizado": "11100.00",
    "cobros_otro": "3700.00",
    "cobros_por_metodo": {
      "EFECTIVO": "5550.00",
      "TRANSFERENCIA": "3700.00",
      "DEBITO": "3700.00",
      "CREDITO": "3700.00",
      "OTRO": "3700.00",
      "BANCARIZADO_LEGACY": "0.00"
    },
    "cobros_ventas": {
      "efectivo": "5550.00",
      "transferencia": "3700.00",
      "debito": "3700.00",
      "credito": "3700.00",
      "otro": "3700.00",
      "bancarizadoLegacy": "0.00",
      "bancarizado": "11100.00",
      "total": "20350.00"
    },
    "cobros_cuenta_corriente": {
      "efectivo": "0.00",
      "transferencia": "3700.00",
      "debito": "0.00",
      "credito": "0.00",
      "otro": "0.00",
      "bancarizadoLegacy": "0.00",
      "bancarizado": "3700.00",
      "total": "3700.00"
    },
    "movimientos_manuales": {
      "ingresos": {
        "efectivo": "0.00",
        "transferencia": "0.00",
        "debito": "0.00",
        "credito": "0.00",
        "otro": "0.00",
        "bancarizadoLegacy": "0.00",
        "bancarizado": "0.00",
        "total": "0.00"
      },
      "egresos": {
        "efectivo": "0.00",
        "transferencia": "0.00",
        "debito": "0.00",
        "credito": "0.00",
        "otro": "0.00",
        "bancarizadoLegacy": "0.00",
        "bancarizado": "0.00",
        "total": "0.00"
      },
      "retiros": {
        "efectivo": "0.00",
        "transferencia": "0.00",
        "debito": "0.00",
        "credito": "0.00",
        "otro": "0.00",
        "bancarizadoLegacy": "0.00",
        "bancarizado": "0.00",
        "total": "0.00"
      }
    },
    "ingresos_manuales": "0.00",
    "ingresos_manuales_bancarizado": "0.00",
    "ingresos_manuales_otro": "0.00",
    "egresos_manuales": "0.00",
    "retiros": "0.00",
    "efectivo_esperado": "6550.00",
    "efectivo_contado": null,
    "diferencia": null
  }
}
```

Campos clave:

- `cobros_ventas`: pagos reales de ventas, incluyendo pagos iniciales de ventas a cuenta corriente.
- `cobros_cuenta_corriente`: pagos posteriores hechos desde `POST /cuentas-corrientes/:id/pagos`.
- Los movimientos informativos con `monto = 0` no alteran estos totales.
- `efectivo_esperado` suma:
  - monto inicial
  - cobros en efectivo por ventas
  - cobros en efectivo posteriores de cuenta corriente
  - ingresos manuales en efectivo
  - resta egresos/retiros en efectivo

## Endpoint: cerrar caja

```http
POST /caja/:id/cerrar
Authorization: Bearer <token>
```

Body:

```json
{
  "efectivo_contado": 6550
}
```

Response:

```json
{
  "id": 12,
  "estado": "CERRADA",
  "almacen_id": 1,
  "usuario_id": 1,
  "fecha_apertura": "2026-07-31T21:32:34.517Z",
  "fecha_cierre": "2026-07-31T22:10:00.000Z",
  "reporte": {
    "monto_inicial": "1000.00",
    "cobros_efectivo": "5550.00",
    "cobros_bancarizado": "11100.00",
    "cobros_otro": "3700.00",
    "cobros_por_metodo": {
      "EFECTIVO": "5550.00",
      "TRANSFERENCIA": "3700.00",
      "DEBITO": "3700.00",
      "CREDITO": "3700.00",
      "OTRO": "3700.00",
      "BANCARIZADO_LEGACY": "0.00"
    },
    "cobros_ventas": {
      "efectivo": "5550.00",
      "transferencia": "3700.00",
      "debito": "3700.00",
      "credito": "3700.00",
      "otro": "3700.00",
      "bancarizadoLegacy": "0.00",
      "bancarizado": "11100.00",
      "total": "20350.00"
    },
    "cobros_cuenta_corriente": {
      "efectivo": "0.00",
      "transferencia": "3700.00",
      "debito": "0.00",
      "credito": "0.00",
      "otro": "0.00",
      "bancarizadoLegacy": "0.00",
      "bancarizado": "3700.00",
      "total": "3700.00"
    },
    "efectivo_esperado": "6550.00",
    "efectivo_contado": "6550.00",
    "diferencia": "0.00"
  }
}
```

## Endpoint: anular movimiento de caja

```http
PATCH /caja/movimiento/:id/anular
Authorization: Bearer <token>
```

Body:

```json
{
  "motivo_anulacion": "Carga duplicada"
}
```

Regla nueva/relevante:

- Si `movimiento.origen = CUENTA_CORRIENTE`, el backend rechaza la anulacion desde caja.
- Esto aplica tanto a movimientos informativos de venta a cuenta corriente como a cobros posteriores de cuenta corriente.

Error esperado:

```json
{
  "message": "Este movimiento proviene de un pago de cuenta corriente. Debe anularse desde cuenta corriente.",
  "error": "Bad Request",
  "statusCode": 400
}
```

Nota: hoy no hay endpoint publico de anulacion especifica de pagos de cuenta corriente. Por lo tanto, el front debe mostrar estos movimientos como no anulables desde caja.

## Validaciones que debe contemplar el front

### Antes de vender a cuenta corriente

- Verificar que haya caja abierta con `GET /caja/activa?almacen_id=<almacenId>`.
- Verificar que haya una cuenta corriente seleccionada.
- Evitar enviar `cuentaCorrienteId` si la venta es contado.
- Enviar `pagos: []` si no hay pago inicial.
- Si hay pago inicial, no permitir que supere el total calculado.

### Al mostrar caja

- No sumar manualmente todos los `movimiento_caja` como si fueran dinero.
- Los movimientos informativos de cuenta corriente tienen `monto = 0`.
- Para totales usar `reporte.cobros_ventas`, `reporte.cobros_cuenta_corriente` y `reporte.movimientos_manuales`.
- Mostrar los informativos como trazabilidad, no como ingreso real.

### Al mostrar cuenta corriente

- Usar `GET /cuentas-corrientes/:id/resumen` para saldos.
- Usar `GET /cuentas-corrientes/:id/ventas` para detalle de deudas por venta.
- Usar `GET /cuentas-corrientes/:id/movimientos` para historial contable de la cuenta.

## Matriz de efectos

| Accion | Requiere caja abierta | Crea ingreso_venta | Crea movimiento_caja | Monto movimiento_caja | Donde suma en reporte |
| --- | --- | --- | --- | --- | --- |
| Venta contado efectivo | No por validacion directa de venta | Si | No | N/A | `cobros_ventas.efectivo` |
| Venta contado transferencia/QR/debito/credito | No por validacion directa de venta | Si | No | N/A | `cobros_ventas.bancarizado` |
| Venta contado otro | No por validacion directa de venta | Si | No | N/A | `cobros_ventas.otro` |
| Venta cuenta corriente sin pago | Si | No | Si, informativo | 0 | No suma dinero |
| Venta cuenta corriente con pago inicial | Si | Si, por el pago inicial | Si, informativo | 0 | Pago inicial suma en `cobros_ventas` |
| Pago posterior cuenta corriente | Si | No | Si, real | Monto pagado | `cobros_cuenta_corriente` |
| Ajuste cuenta corriente | No | No | No | N/A | No impacta caja |

## Casos de error frecuentes

### Cuenta corriente sin caja abierta

Request:

```json
{
  "usuarioId": 1,
  "almacenId": 1,
  "tipoCobro": "CUENTA_CORRIENTE",
  "cuentaCorrienteId": 15,
  "items": [{ "productoId": 2, "cantidad": 1 }],
  "pagos": []
}
```

Response:

```json
{
  "message": "No hay caja abierta para el almacen 1",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Falta `cuentaCorrienteId`

```json
{
  "message": "cuentaCorrienteId es obligatorio para ventas a cuenta corriente",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Se manda `cuentaCorrienteId` en venta contado

```json
{
  "message": "cuentaCorrienteId solo puede enviarse con tipoCobro CUENTA_CORRIENTE",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Pago inicial supera el total

```json
{
  "message": "El pago inicial (5000) no puede superar el total de la venta (3700). Para generar saldo a favor, registrar un pago posterior en cuenta corriente.",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Pago con `OTRO` sin detalle

```json
{
  "message": [
    "detalle_pago must be longer than or equal to 3 characters",
    "detalle_pago must be a string"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

## Checklist para implementacion frontend

- Agregar selector `Contado / Cuenta corriente` en venta.
- Si es cuenta corriente, requerir cliente/cuenta.
- Si es cuenta corriente, consultar caja abierta antes de confirmar.
- Permitir `pagos: []` solo para cuenta corriente.
- Permitir pago inicial parcial en cuenta corriente.
- Bloquear pago inicial mayor al total.
- Refrescar resumen de caja luego de venta cuenta corriente, aunque no haya pago.
- Mostrar movimiento informativo en caja como trazabilidad con monto 0.
- No permitir anulacion desde caja para movimientos `origen = CUENTA_CORRIENTE`.
- En cobro posterior de cuenta corriente, requerir caja abierta.
- En cobro posterior con metodo `OTRO`, requerir `detalle_pago`.
- Usar `cobros_cuenta_corriente` del reporte para pagos posteriores.
- Usar `cobros_ventas` del reporte para pagos de ventas y pagos iniciales.
