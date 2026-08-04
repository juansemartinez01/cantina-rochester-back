import { Client } from 'pg';

const API_URL = (process.env.API_URL ?? '').replace(/\/+$/, '');
const DATABASE_URL = process.env.DATABASE_URL;
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

if (!API_URL || !DATABASE_URL || !EMAIL || !PASSWORD) {
  throw new Error(
    'Faltan env vars: API_URL, DATABASE_URL, TEST_EMAIL, TEST_PASSWORD',
  );
}

const prefix = `TEST-CODEX-${new Date()
  .toISOString()
  .replace(/[-:.TZ]/g, '')
  .slice(0, 14)}`;

const created = {
  prefix,
  openedCajaId: null,
  usedExistingCajaId: null,
  cuentaId: null,
  ventaIds: [],
  movimientoCajaIds: [],
  cuentaPagoIds: [],
  cuentaVentaIds: [],
  productoSnapshots: [],
};

let token = null;
let user = null;
let almacen = null;
let producto = null;

function money(value) {
  return Number(Number(value).toFixed(2));
}

function asNumber(value) {
  return Number(value ?? 0);
}

function assert(condition, message, extra) {
  if (!condition) {
    const detail = extra ? ` ${JSON.stringify(extra)}` : '';
    throw new Error(`${message}${detail}`);
  }
}

async function request(path, options = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : options.body,
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const error = new Error(`HTTP ${res.status} ${path}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function requestExpectError(path, options = {}) {
  try {
    const data = await request(path, options);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      status: error.status,
      data: error.data,
      message: error.message,
    };
  }
}

async function dbQuery(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

async function getInitialContext(client) {
  const almacenes = await dbQuery(
    client,
    `SELECT id, nombre FROM almacen WHERE nombre = 'Almacen Principal' ORDER BY id LIMIT 1`,
  );
  assert(almacenes.length === 1, 'No encontre Almacen Principal');
  almacen = almacenes[0];

  const productos = await dbQuery(
    client,
    `
      SELECT p.id, p.nombre, p."precioBase", p.es_por_gramos,
             sa.cantidad, sa.cantidad_gramos
      FROM producto p
      JOIN stock_actual sa
        ON sa.producto_id = p.id
       AND sa.almacen_id = $1
      WHERE p.activo = true
        AND p.es_por_gramos = false
        AND COALESCE(p."precioBase", 0) > 0
      ORDER BY p.id
      LIMIT 1
    `,
    [almacen.id],
  );
  assert(productos.length === 1, 'No encontre producto activo con precio > 0');
  producto = productos[0];
  created.productoSnapshots.push({
    producto_id: producto.id,
    almacen_id: almacen.id,
    cantidad: producto.cantidad,
    cantidad_gramos: producto.cantidad_gramos,
  });
}

async function login() {
  const auth = await request('/auth/login', {
    method: 'POST',
    body: { email: EMAIL, password: PASSWORD },
  });
  token = auth.access_token;
  user = auth.user;
  assert(token, 'Login no devolvio access_token');
  assert(user?.id, 'Login no devolvio user.id');
}

async function ensureNoCajaRequiredBeforeOpen() {
  const active = await requestExpectError(
    `/caja/activa?almacen_id=${almacen.id}`,
  );

  if (active.ok) {
    created.usedExistingCajaId = active.data.id;
    return {
      skipped: true,
      reason: `Ya habia caja abierta #${active.data.id}`,
    };
  }

  const result = await requestExpectError('/ventas', {
    method: 'POST',
    body: {
      usuarioId: user.id,
      almacenId: almacen.id,
      tipoCobro: 'CUENTA_CORRIENTE',
      cuentaCorrienteId: 999999999,
      pagos: [],
      items: [{ productoId: producto.id, cantidad: 1 }],
    },
  });

  assert(!result.ok, 'La venta CC sin caja abierta no fallo');
  const serialized = JSON.stringify(result.data ?? {});
  assert(
    result.status === 400 &&
      serialized.toLowerCase().includes('no hay caja abierta'),
    'La venta CC sin caja abierta fallo por otro motivo',
    result,
  );

  return { skipped: false, status: result.status, data: result.data };
}

async function openCajaIfNeeded() {
  if (created.usedExistingCajaId) {
    return { id: created.usedExistingCajaId, reused: true };
  }

  const caja = await request('/caja/abrir', {
    method: 'POST',
    body: {
      almacen_id: almacen.id,
      monto_inicial: 100,
      observacion: `${prefix} apertura flujo caja/cuenta corriente`,
    },
  });
  created.openedCajaId = caja.id;
  return { id: caja.id, reused: false };
}

async function createCuentaCorriente() {
  const cuenta = await request('/cuentas-corrientes', {
    method: 'POST',
    body: {
      nombre: `${prefix} Cliente Cuenta`,
      documento: prefix.slice(0, 50),
      observaciones: `${prefix} cuenta creada por prueba automatizada`,
    },
  });
  created.cuentaId = cuenta.id;
  return cuenta;
}

async function createVenta(body) {
  const venta = await request('/ventas', {
    method: 'POST',
    body: {
      usuarioId: user.id,
      almacenId: almacen.id,
      items: [{ productoId: producto.id, cantidad: 1 }],
      ...body,
    },
  });
  created.ventaIds.push(venta.id);
  return venta;
}

async function runSalesAndPayments() {
  const price = money(await request(`/productos/${producto.id}/precio?almacenId=${almacen.id}`));
  assert(price > 0, 'El precio final del producto de prueba no es mayor a cero', {
    producto,
    price,
  });

  const contado = [];
  for (const metodo of ['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO']) {
    contado.push(
      await createVenta({
        tipoCobro: 'CONTADO',
        pagos: [{ medio: metodo, monto: price }],
      }),
    );
  }
  contado.push(
    await createVenta({
      tipoCobro: 'CONTADO',
      pagos: [
        {
          medio: 'OTRO',
          monto: price,
          detalle_pago: `${prefix} otro`,
        },
      ],
    }),
  );

  const ccSinPago = await createVenta({
    tipoCobro: 'CUENTA_CORRIENTE',
    cuentaCorrienteId: created.cuentaId,
    pagos: [],
  });

  const pagoInicial = money(price / 2);
  const ccConPagoInicial = await createVenta({
    tipoCobro: 'CUENTA_CORRIENTE',
    cuentaCorrienteId: created.cuentaId,
    pagos: [{ medio: 'EFECTIVO', monto: pagoInicial }],
  });

  const pagoPosterior = await request(
    `/cuentas-corrientes/${created.cuentaId}/pagos`,
    {
      method: 'POST',
      body: {
        almacenId: almacen.id,
        monto: price,
        medioPago: 'TRANSFERENCIA',
        referencia: `${prefix} pago posterior`,
        observacion: `${prefix} pago posterior CC`,
      },
    },
  );
  created.cuentaPagoIds.push(pagoPosterior.pago.id);
  if (pagoPosterior.movimientoCaja?.id) {
    created.movimientoCajaIds.push(pagoPosterior.movimientoCaja.id);
  }

  return {
    price,
    contadoIds: contado.map((v) => v.id),
    ccSinPagoId: ccSinPago.id,
    ccConPagoInicialId: ccConPagoInicial.id,
    pagoInicial,
    pagoPosteriorId: pagoPosterior.pago.id,
  };
}

async function collectCreatedIds(client, cajaId) {
  const ccVentas = await dbQuery(
    client,
    `SELECT id FROM cuenta_corriente_venta WHERE cuenta_corriente_id = $1 ORDER BY id`,
    [created.cuentaId],
  );
  created.cuentaVentaIds = ccVentas.map((row) => row.id);

  const ccPagos = await dbQuery(
    client,
    `SELECT id FROM cuenta_corriente_pago WHERE cuenta_corriente_id = $1 ORDER BY id`,
    [created.cuentaId],
  );
  created.cuentaPagoIds = [...new Set([
    ...created.cuentaPagoIds,
    ...ccPagos.map((row) => row.id),
  ])];

  const movs = await dbQuery(
    client,
    `
      SELECT id
      FROM movimiento_caja
      WHERE caja_id = $1
        AND (
          motivo LIKE $2
          OR observacion LIKE $2
        )
      ORDER BY id
    `,
    [cajaId, `%${prefix}%`],
  );
  created.movimientoCajaIds = [...new Set([
    ...created.movimientoCajaIds,
    ...movs.map((row) => row.id),
  ])];
}

async function verify(client, cajaId, flow) {
  await collectCreatedIds(client, cajaId);

  const ingresos = await dbQuery(
    client,
    `
      SELECT tipo, COUNT(*)::int AS count, COALESCE(SUM(monto), 0)::float AS total
      FROM ingreso_venta
      WHERE venta_id = ANY($1::int[])
      GROUP BY tipo
      ORDER BY tipo
    `,
    [created.ventaIds],
  );

  const ingresosByTipo = Object.fromEntries(
    ingresos.map((row) => [row.tipo, { count: row.count, total: row.total }]),
  );
  for (const metodo of ['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OTRO']) {
    assert(ingresosByTipo[metodo], `No se registro ingreso_venta ${metodo}`);
  }
  assert(
    money(ingresosByTipo.EFECTIVO.total) === money(flow.price + flow.pagoInicial),
    'Total EFECTIVO de ventas no coincide',
    ingresosByTipo.EFECTIVO,
  );
  for (const metodo of ['TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OTRO']) {
    assert(
      money(ingresosByTipo[metodo].total) === flow.price,
      `Total ${metodo} de ventas no coincide`,
      ingresosByTipo[metodo],
    );
  }

  const ccMovs = await dbQuery(
    client,
    `
      SELECT id, tipo, medio_pago, origen, cuenta_corriente_pago_id,
             monto::float AS monto, motivo, observacion, anulado
      FROM movimiento_caja
      WHERE id = ANY($1::int[])
      ORDER BY id
    `,
    [created.movimientoCajaIds],
  );
  const informativos = ccMovs.filter(
    (row) =>
      row.origen === 'CUENTA_CORRIENTE' &&
      row.cuenta_corriente_pago_id === null &&
      money(row.monto) === 0,
  );
  const cobrosCc = ccMovs.filter(
    (row) =>
      row.origen === 'CUENTA_CORRIENTE' &&
      row.cuenta_corriente_pago_id !== null &&
      money(row.monto) > 0,
  );
  assert(informativos.length === 2, 'No hay dos movimientos informativos CC', ccMovs);
  assert(cobrosCc.length === 1, 'No hay un movimiento real de cobro CC', ccMovs);
  assert(
    money(cobrosCc[0].monto) === flow.price &&
      cobrosCc[0].medio_pago === 'TRANSFERENCIA',
    'Movimiento real CC no coincide',
    cobrosCc[0],
  );

  const cuenta = await request(`/cuentas-corrientes/${created.cuentaId}/resumen`);
  const expectedSaldo = money(flow.price - flow.pagoInicial);
  assert(
    money(cuenta.saldoActual) === expectedSaldo,
    'Saldo de cuenta corriente no coincide',
    cuenta,
  );

  const ccVentas = await dbQuery(
    client,
    `
      SELECT id, venta_id, monto_original::float AS monto_original,
             monto_pagado::float AS monto_pagado,
             monto_pendiente::float AS monto_pendiente,
             estado
      FROM cuenta_corriente_venta
      WHERE cuenta_corriente_id = $1
      ORDER BY id
    `,
    [created.cuentaId],
  );
  assert(ccVentas.length === 2, 'No hay dos ventas de cuenta corriente', ccVentas);
  assert(
    ccVentas.some((row) => row.estado === 'PAGADA' && money(row.monto_pendiente) === 0),
    'No hay venta CC pagada luego del pago posterior',
    ccVentas,
  );
  assert(
    ccVentas.some((row) => row.estado === 'PARCIAL' && money(row.monto_pendiente) === expectedSaldo),
    'No hay venta CC parcial con pendiente esperado',
    ccVentas,
  );

  const reporte = await request(`/caja/${cajaId}/reporte`);
  const rep = reporte.reporte;
  assert(
    money(rep.cobros_ventas.efectivo) >= money(flow.price + flow.pagoInicial),
    'Reporte caja no incluye cobros efectivo de ventas',
    rep.cobros_ventas,
  );
  assert(
    money(rep.cobros_ventas.transferencia) >= flow.price,
    'Reporte caja no incluye transferencia de ventas',
    rep.cobros_ventas,
  );
  assert(
    money(rep.cobros_ventas.debito) >= flow.price,
    'Reporte caja no incluye debito de ventas',
    rep.cobros_ventas,
  );
  assert(
    money(rep.cobros_ventas.credito) >= flow.price,
    'Reporte caja no incluye credito de ventas',
    rep.cobros_ventas,
  );
  assert(
    money(rep.cobros_ventas.otro) >= flow.price,
    'Reporte caja no incluye otro de ventas',
    rep.cobros_ventas,
  );
  assert(
    money(rep.cobros_cuenta_corriente.transferencia) >= flow.price,
    'Reporte caja no incluye cobro posterior de CC',
    rep.cobros_cuenta_corriente,
  );

  const anular = await requestExpectError(`/caja/movimiento/${informativos[0].id}/anular`, {
    method: 'PATCH',
    body: { motivo_anulacion: `${prefix} intento anulacion bloqueada` },
  });
  assert(!anular.ok && anular.status === 400, 'Movimiento CC se pudo anular desde caja', anular);

  return {
    ingresosByTipo,
    movimientosCuentaCorriente: ccMovs,
    cuentaResumen: cuenta,
    cuentaVentas: ccVentas,
    reporteCaja: rep,
    anulacionCuentaCorrienteBloqueada: anular.data,
  };
}

async function closeCajaIfOwned(cajaId, flow) {
  if (!created.openedCajaId) return { skipped: true };

  const efectivoContado = money(100 + flow.price + flow.pagoInicial);
  return request(`/caja/${cajaId}/cerrar`, {
    method: 'POST',
    body: { efectivo_contado: efectivoContado },
  });
}

async function cleanup(client) {
  await client.query('BEGIN');
  try {
    if (created.movimientoCajaIds.length > 0) {
      await client.query(`DELETE FROM movimiento_caja WHERE id = ANY($1::int[])`, [
        created.movimientoCajaIds,
      ]);
    }
    if (created.cuentaPagoIds.length > 0) {
      await client.query(
        `DELETE FROM cuenta_corriente_pago_aplicacion WHERE pago_id = ANY($1::int[])`,
        [created.cuentaPagoIds],
      );
    }
    if (created.cuentaVentaIds.length > 0) {
      await client.query(
        `DELETE FROM cuenta_corriente_pago_aplicacion WHERE cuenta_corriente_venta_id = ANY($1::int[])`,
        [created.cuentaVentaIds],
      );
    }
    if (created.cuentaId) {
      await client.query(
        `DELETE FROM cuenta_corriente_movimiento WHERE cuenta_corriente_id = $1`,
        [created.cuentaId],
      );
      await client.query(
        `DELETE FROM cuenta_corriente_pago WHERE cuenta_corriente_id = $1`,
        [created.cuentaId],
      );
      await client.query(
        `DELETE FROM cuenta_corriente_venta WHERE cuenta_corriente_id = $1`,
        [created.cuentaId],
      );
    }
    if (created.ventaIds.length > 0) {
      await client.query(`DELETE FROM ingreso_venta WHERE venta_id = ANY($1::int[])`, [
        created.ventaIds,
      ]);
      await client.query(`DELETE FROM venta_ajuste WHERE venta_id = ANY($1::int[])`, [
        created.ventaIds,
      ]);
      await client.query(
        `DELETE FROM movimiento_stock WHERE motivo = ANY($1::text[])`,
        [created.ventaIds.map((id) => `Venta #${id}`)],
      );
      await client.query(`DELETE FROM venta_item WHERE venta_id = ANY($1::int[])`, [
        created.ventaIds,
      ]);
      await client.query(`DELETE FROM venta WHERE id = ANY($1::int[])`, [
        created.ventaIds,
      ]);
    }
    if (created.cuentaId) {
      await client.query(`DELETE FROM cuenta_corriente WHERE id = $1`, [
        created.cuentaId,
      ]);
    }
    if (created.openedCajaId) {
      await client.query(`DELETE FROM sesion_caja WHERE id = $1`, [
        created.openedCajaId,
      ]);
    }
    for (const snapshot of created.productoSnapshots) {
      await client.query(
        `
          UPDATE stock_actual
          SET cantidad = $3,
              cantidad_gramos = $4
          WHERE producto_id = $1
            AND almacen_id = $2
        `,
        [
          snapshot.producto_id,
          snapshot.almacen_id,
          snapshot.cantidad,
          snapshot.cantidad_gramos,
        ],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function verifyCleanup(client) {
  const checks = {};
  checks.ventas = Number(
    (
      await dbQuery(client, `SELECT COUNT(*) AS count FROM venta WHERE id = ANY($1::int[])`, [
        created.ventaIds,
      ])
    )[0].count,
  );
  checks.cuentaCorriente = created.cuentaId
    ? Number(
        (
          await dbQuery(client, `SELECT COUNT(*) AS count FROM cuenta_corriente WHERE id = $1`, [
            created.cuentaId,
          ])
        )[0].count,
      )
    : 0;
  checks.movimientosCaja = created.movimientoCajaIds.length
    ? Number(
        (
          await dbQuery(client, `SELECT COUNT(*) AS count FROM movimiento_caja WHERE id = ANY($1::int[])`, [
            created.movimientoCajaIds,
          ])
        )[0].count,
      )
    : 0;
  checks.sesionCaja = created.openedCajaId
    ? Number(
        (
          await dbQuery(client, `SELECT COUNT(*) AS count FROM sesion_caja WHERE id = $1`, [
            created.openedCajaId,
          ])
        )[0].count,
      )
    : 0;
  const stockRows = await dbQuery(
    client,
    `
      SELECT cantidad, cantidad_gramos
      FROM stock_actual
      WHERE producto_id = $1
        AND almacen_id = $2
    `,
    [
      created.productoSnapshots[0].producto_id,
      created.productoSnapshots[0].almacen_id,
    ],
  );
  checks.stockRestaurado =
    stockRows.length === 1 &&
    String(stockRows[0].cantidad) === String(created.productoSnapshots[0].cantidad) &&
    String(stockRows[0].cantidad_gramos ?? '') ===
      String(created.productoSnapshots[0].cantidad_gramos ?? '');

  assert(
    checks.ventas === 0 &&
      checks.cuentaCorriente === 0 &&
      checks.movimientosCaja === 0 &&
      checks.sesionCaja === 0 &&
      checks.stockRestaurado,
    'La limpieza dejo residuos',
    checks,
  );
  return checks;
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: false,
});

const result = {
  prefix,
  created,
  steps: {},
  verification: null,
  cleanup: null,
};

try {
  await client.connect();
  await login();
  await getInitialContext(client);
  result.steps.context = { userId: user.id, almacen, producto };
  result.steps.preOpenCuentaCorrienteRequiresCaja =
    await ensureNoCajaRequiredBeforeOpen();
  const caja = await openCajaIfNeeded();
  result.steps.caja = caja;
  await createCuentaCorriente();
  result.steps.cuentaId = created.cuentaId;
  const flow = await runSalesAndPayments();
  result.steps.flow = flow;
  result.verification = await verify(client, caja.id, flow);
  result.steps.cierreCaja = await closeCajaIfOwned(caja.id, flow);
} finally {
  try {
    if (client._connected) {
      await collectCreatedIds(client, created.openedCajaId ?? created.usedExistingCajaId);
      await cleanup(client);
      result.cleanup = await verifyCleanup(client);
    }
  } catch (cleanupError) {
    result.cleanupError = {
      message: cleanupError.message,
      stack: cleanupError.stack,
    };
    throw cleanupError;
  } finally {
    await client.end().catch(() => {});
    console.log(JSON.stringify(result, null, 2));
  }
}
