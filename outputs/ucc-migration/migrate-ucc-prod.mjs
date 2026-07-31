import { Client } from "pg";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const QUICK_BARCODE = "000000000000";
const EXCEL_PATH =
  "C:/Users/juans/OneDrive/Desktop/Proyectos/gestion-stock-backend - Rochester/outputs/ucc-migration/productos-bar-ucc-normalizado.xlsx";

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: false,
});

const dryRun = process.env.DRY_RUN === "true";
const confirmed = process.env.MIGRATION_CONFIRM === "UCC_PROD_20260731";

if (!dryRun && !confirmed) {
  throw new Error(
    "Set MIGRATION_CONFIRM=UCC_PROD_20260731 to run the production migration.",
  );
}

function quoteIdent(name) {
  return `"${String(name).replaceAll('"', '""')}"`;
}

async function query(sql, params = []) {
  return client.query(sql, params);
}

async function tableExists(tableName) {
  const result = await query("SELECT to_regclass($1) AS regclass", [
    `public.${tableName}`,
  ]);
  return result.rows[0]?.regclass != null;
}

async function deleteAll(tableName) {
  if (!(await tableExists(tableName))) return 0;
  const result = await query(`DELETE FROM ${quoteIdent(tableName)}`);
  return result.rowCount ?? 0;
}

async function getOrInsertUnidad(nombre, abreviatura) {
  let result = await query(
    `SELECT id FROM unidad
     WHERE lower(trim(nombre)) = lower($1) OR lower(trim(COALESCE(abreviatura, ''))) = lower($2)
     ORDER BY id
     LIMIT 1`,
    [nombre, abreviatura],
  );
  if (result.rows[0]) {
    await query(
      `UPDATE unidad SET nombre = $1, abreviatura = $2 WHERE id = $3`,
      [nombre, abreviatura, result.rows[0].id],
    );
    return result.rows[0].id;
  }
  result = await query(
    `INSERT INTO unidad (nombre, abreviatura) VALUES ($1, $2) RETURNING id`,
    [nombre, abreviatura],
  );
  return result.rows[0].id;
}

async function getOrInsertCategoria(nombre, descripcion = null) {
  let result = await query(
    `SELECT id FROM categoria WHERE lower(trim(nombre)) = lower($1) ORDER BY id LIMIT 1`,
    [nombre],
  );
  if (result.rows[0]) {
    await query(
      `UPDATE categoria SET nombre = $1, descripcion = $2 WHERE id = $3`,
      [nombre, descripcion, result.rows[0].id],
    );
    return result.rows[0].id;
  }
  result = await query(
    `INSERT INTO categoria (nombre, descripcion) VALUES ($1, $2) RETURNING id`,
    [nombre, descripcion],
  );
  return result.rows[0].id;
}

async function getOrInsertProveedorGenerico() {
  let result = await query(
    `SELECT id FROM proveedor WHERE lower(trim(nombre)) = lower($1) ORDER BY id LIMIT 1`,
    ["Proveedor generico"],
  );
  if (result.rows[0]) {
    await query(
      `UPDATE proveedor
       SET nombre = 'Proveedor generico', contacto = NULL, telefono = NULL, email = NULL
       WHERE id = $1`,
      [result.rows[0].id],
    );
    return result.rows[0].id;
  }
  result = await query(
    `INSERT INTO proveedor (nombre, contacto, telefono, email)
     VALUES ('Proveedor generico', NULL, NULL, NULL)
     RETURNING id`,
  );
  return result.rows[0].id;
}

async function resetSequenceFor(tableName, columnName) {
  const seq = await query("SELECT pg_get_serial_sequence($1, $2) AS seq", [
    tableName,
    columnName,
  ]);
  const sequenceName = seq.rows[0]?.seq;
  if (!sequenceName) return;

  const maxResult = await query(
    `SELECT COALESCE(MAX(${quoteIdent(columnName)}), 0)::bigint AS max_id FROM ${quoteIdent(tableName)}`,
  );
  const maxId = Number(maxResult.rows[0].max_id);
  await query("SELECT setval($1::regclass, $2, $3)", [
    sequenceName,
    maxId > 0 ? maxId : 1,
    maxId > 0,
  ]);
}

async function resetAllSequences() {
  const serialColumns = await query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_default LIKE 'nextval(%'
    ORDER BY table_name, ordinal_position
  `);
  for (const row of serialColumns.rows) {
    await resetSequenceFor(row.table_name, row.column_name);
  }
}

async function readProducts() {
  const input = await FileBlob.load(EXCEL_PATH);
  const workbook = await SpreadsheetFile.importXlsx(input);
  const sheet = workbook.worksheets.getItem("Productos");
  const values = sheet.getRange("A1:O179").values;
  const headers = values[0];
  const expected = [
    "sku",
    "barcode",
    "nombre",
    "descripcion",
    "categoria",
    "unidad",
    "es_por_gramos",
    "proveedor",
    "activo",
    "precio_base",
    "precio_almacen1",
    "en_oferta",
    "precio_oferta",
    "stock_unidades",
    "stock_gramos",
  ];
  if (JSON.stringify(headers) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected import headers: ${JSON.stringify(headers)}`);
  }
  const rows = values.slice(1).filter((row) => row.some((value) => value != null));
  const products = rows.map((row) => ({
    sku: String(row[0]).trim(),
    barcode: String(row[1]).trim(),
    nombre: String(row[2]).trim(),
    descripcion: row[3] == null ? null : String(row[3]).trim(),
    categoria: String(row[4]).trim(),
    unidad: String(row[5]).trim(),
    proveedor: String(row[7]).trim(),
    precioBase: Number(row[9]),
    precioAlmacen: Number(row[10]),
    stockUnidades: Number(row[13] ?? 0),
  }));

  const skus = new Set();
  const barcodes = new Set();
  for (const product of products) {
    if (!product.sku || !product.nombre || !Number.isFinite(product.precioBase)) {
      throw new Error(`Invalid product row: ${JSON.stringify(product)}`);
    }
    if (skus.has(product.sku)) throw new Error(`Duplicate SKU ${product.sku}`);
    if (barcodes.has(product.barcode)) {
      throw new Error(`Duplicate barcode ${product.barcode}`);
    }
    if (product.barcode === QUICK_BARCODE) {
      throw new Error("Client file cannot reuse quick product barcode.");
    }
    skus.add(product.sku);
    barcodes.add(product.barcode);
  }
  return products;
}

async function countTables() {
  const tableNames = [
    "almacen",
    "categoria",
    "cuenta_corriente",
    "gasto",
    "gasto_categoria",
    "ingreso_venta",
    "movimiento_caja",
    "movimiento_stock",
    "orden_compra",
    "producto",
    "producto_precio_almacen",
    "producto_precio_historial",
    "promocion",
    "proveedor",
    "roles",
    "sesion_caja",
    "stock_actual",
    "unidad",
    "usuario_rol",
    "usuarios",
    "venta",
  ];
  const counts = {};
  for (const tableName of tableNames) {
    const result = await query(
      `SELECT COUNT(*)::int AS count FROM ${quoteIdent(tableName)}`,
    );
    counts[tableName] = result.rows[0].count;
  }
  return counts;
}

function buildValues(rows, columnsPerRow, offset = 1) {
  return rows
    .map((_, rowIndex) => {
      const start = offset + rowIndex * columnsPerRow;
      return `(${Array.from({ length: columnsPerRow }, (_v, colIndex) => `$${start + colIndex}`).join(", ")})`;
    })
    .join(", ");
}

const products = await readProducts();
const categories = [...new Set(products.map((product) => product.categoria))].sort();

await client.connect();

try {
  await query("BEGIN");

  const beforeCounts = await countTables();
  const deleted = {};

  for (const tableName of [
    "factura_venta_item",
    "facturas",
    "cuenta_corriente_pago_aplicacion",
    "cuenta_corriente_movimiento",
    "cuenta_corriente_venta",
    "cuenta_corriente_pago",
    "cuenta_corriente",
    "ingreso_venta",
    "extraccion_ingreso",
    "venta_ajuste",
    "venta_item",
    "venta",
    "movimiento_caja",
    "sesion_caja",
    "movimiento_stock",
    "orden_compra_item",
    "gasto",
    "orden_compra",
    "gasto_categoria",
    "promocion_producto",
    "promocion-producto",
    "promocion",
    "parametros_reorden",
    "producto_precio_historial",
    "producto_precio_almacen",
    "stock_actual",
  ]) {
    deleted[tableName] = await deleteAll(tableName);
  }

  const unidadId = await getOrInsertUnidad("Unidad", "u");
  await getOrInsertUnidad("Gramo", "g");
  await query(`
    DELETE FROM unidad
    WHERE lower(trim(nombre)) NOT IN ('unidad', 'gramo')
      AND lower(trim(COALESCE(abreviatura, ''))) NOT IN ('u', 'g')
  `);

  const generalCategoriaId = await getOrInsertCategoria(
    "General",
    "Categoria general inicial",
  );

  const quickResult = await query(
    `SELECT id FROM producto WHERE barcode = $1 ORDER BY id LIMIT 1`,
    [QUICK_BARCODE],
  );

  await query(`DELETE FROM producto WHERE barcode IS DISTINCT FROM $1`, [
    QUICK_BARCODE,
  ]);

  await query(`DELETE FROM categoria WHERE id <> $1`, [generalCategoriaId]);

  const categoriaIds = new Map([["General", generalCategoriaId]]);
  for (const category of categories) {
    categoriaIds.set(category, await getOrInsertCategoria(category));
  }

  const proveedorId = await getOrInsertProveedorGenerico();
  await query(`DELETE FROM proveedor WHERE id <> $1`, [proveedorId]);

  await query(`DELETE FROM almacen WHERE id <> 1`);
  const almacenResult = await query(
    `SELECT id FROM almacen WHERE id = 1 LIMIT 1`,
  );
  if (!almacenResult.rows[0]) {
    await query(
      `INSERT INTO almacen (id, nombre, ubicacion, capacidad)
       VALUES (1, 'Almacen Principal', 'Principal', NULL)`,
    );
  } else {
    await query(
      `UPDATE almacen
       SET nombre = 'Almacen Principal', ubicacion = 'Principal', capacidad = NULL
       WHERE id = 1`,
    );
  }

  let quickProductId = quickResult.rows[0]?.id;
  if (quickProductId) {
    await query(
      `UPDATE producto
       SET sku = 'CARGA-RAPIDA',
           nombre = 'Producto de carga rapida',
           descripcion = NULL,
           unidad_id = $1,
           categoria_id = $2,
           barcode = $3,
           "precioBase" = 0,
           activo = true,
           es_por_gramos = false,
           "inOferta" = false,
           precio_updated_at = now(),
           "proveedorNombre" = 'Proveedor generico',
           updated_at = now()
       WHERE id = $4`,
      [unidadId, generalCategoriaId, QUICK_BARCODE, quickProductId],
    );
  } else {
    const insertedQuick = await query(
      `INSERT INTO producto
         (sku, nombre, descripcion, unidad_id, categoria_id, barcode, "precioBase",
          activo, es_por_gramos, "inOferta", precio_updated_at, "proveedorNombre")
       VALUES
         ('CARGA-RAPIDA', 'Producto de carga rapida', NULL, $1, $2, $3, 0,
          true, false, false, now(), 'Proveedor generico')
       RETURNING id`,
      [unidadId, generalCategoriaId, QUICK_BARCODE],
    );
    quickProductId = insertedQuick.rows[0].id;
  }

  await query(
    `INSERT INTO stock_actual (producto_id, almacen_id, cantidad, cantidad_gramos)
     VALUES ($1, 1, 0, NULL)
     ON CONFLICT (producto_id, almacen_id)
     DO UPDATE SET cantidad = 0, cantidad_gramos = NULL, last_updated = now()`,
    [quickProductId],
  );

  await resetSequenceFor("producto", "id");

  const productParams = [];
  for (const product of products) {
    productParams.push(
      product.sku,
      product.nombre,
      product.descripcion,
      unidadId,
      categoriaIds.get(product.categoria),
      product.barcode,
      product.precioBase,
      product.proveedor,
    );
  }
  const insertedRows = await query(
    `INSERT INTO producto
       (sku, nombre, descripcion, unidad_id, categoria_id, barcode, "precioBase",
        activo, es_por_gramos, "inOferta", precio_updated_at, "proveedorNombre")
     VALUES ${products
       .map((_product, index) => {
         const start = index * 8 + 1;
         return `($${start}, $${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5}, $${start + 6}, true, false, false, now(), $${start + 7})`;
       })
       .join(", ")}
     RETURNING id, sku`,
    productParams,
  );
  const productIdBySku = new Map(
    insertedRows.rows.map((row) => [row.sku, row.id]),
  );

  const stockParams = [];
  for (const product of products) {
    stockParams.push(productIdBySku.get(product.sku), product.stockUnidades);
  }
  await query(
    `INSERT INTO stock_actual (producto_id, almacen_id, cantidad, cantidad_gramos)
     VALUES ${products.map((_product, index) => `($${index * 2 + 1}, 1, $${index * 2 + 2}, NULL)`).join(", ")}`,
    stockParams,
  );

  const priceParams = [];
  for (const product of products) {
    priceParams.push(productIdBySku.get(product.sku), product.precioAlmacen);
  }
  await query(
    `INSERT INTO producto_precio_almacen
       (producto_id, almacen_id, precio, moneda, "inOferta", precio_oferta)
     VALUES ${products.map((_product, index) => `($${index * 2 + 1}, 1, $${index * 2 + 2}, 'ARS', false, NULL)`).join(", ")}`,
    priceParams,
  );
  const insertedProducts = insertedRows.rowCount ?? 0;

  await resetAllSequences();

  const afterCounts = await countTables();
  const checks = {
    products: afterCounts.producto,
    stockRows: afterCounts.stock_actual,
    priceRows: afterCounts.producto_precio_almacen,
    categories: afterCounts.categoria,
    unidades: afterCounts.unidad,
    almacenes: afterCounts.almacen,
    proveedores: afterCounts.proveedor,
    users: afterCounts.usuarios,
    roles: afterCounts.roles,
    usuarioRol: afterCounts.usuario_rol,
    openCashSessions: (
      await query(`SELECT COUNT(*)::int AS count FROM sesion_caja WHERE estado = 'ABIERTA'`)
    ).rows[0].count,
    codexRows: (
      await query(`
        SELECT
          (SELECT COUNT(*)::int FROM producto WHERE nombre ILIKE '%codex%') +
          (SELECT COUNT(*)::int FROM almacen WHERE nombre ILIKE '%codex%') +
          (SELECT COUNT(*)::int FROM proveedor WHERE nombre ILIKE '%codex%') AS count
      `)
    ).rows[0].count,
  };

  if (checks.products !== products.length + 1) {
    throw new Error(`Expected ${products.length + 1} products, got ${checks.products}`);
  }
  if (checks.stockRows !== products.length + 1) {
    throw new Error(`Expected ${products.length + 1} stock rows, got ${checks.stockRows}`);
  }
  if (checks.priceRows !== products.length) {
    throw new Error(`Expected ${products.length} price override rows, got ${checks.priceRows}`);
  }
  if (checks.almacenes !== 1 || checks.proveedores !== 1) {
    throw new Error(`Unexpected almacenes/proveedores: ${JSON.stringify(checks)}`);
  }
  if (checks.openCashSessions !== 0 || checks.codexRows !== 0) {
    throw new Error(`Production cleanup checks failed: ${JSON.stringify(checks)}`);
  }

  if (dryRun) {
    await query("ROLLBACK");
  } else {
    await query("COMMIT");
  }

  console.log(JSON.stringify({
    dryRun,
    beforeCounts,
    deleted,
    insertedProducts,
    importedCategories: categories,
    checks,
  }, null, 2));
} catch (error) {
  try {
    await query("ROLLBACK");
  } catch {}
  throw error;
} finally {
  await client.end();
}
