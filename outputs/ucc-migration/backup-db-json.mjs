import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const outputDir =
  "C:/Users/juans/OneDrive/Desktop/Proyectos/gestion-stock-backend - Rochester/outputs/ucc-migration/backups";

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: false,
});

function quoteIdent(name) {
  return `"${String(name).replaceAll('"', '""')}"`;
}

async function query(sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

await fs.mkdir(outputDir, { recursive: true });
await client.connect();

try {
  await client.query("BEGIN READ ONLY");

  const tables = await query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);

  const backup = {
    createdAt: new Date().toISOString(),
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    schema: {
      columns: await query(`
        SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
      `),
      constraints: await query(`
        SELECT tc.table_name, tc.constraint_name, tc.constraint_type,
               kcu.column_name, ccu.table_name AS foreign_table_name,
               ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
         AND ccu.table_schema = tc.table_schema
        WHERE tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position
      `),
      sequences: await query(`
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
        ORDER BY sequence_name
      `),
      enums: await query(`
        SELECT t.typname AS enum_name, e.enumlabel AS enum_value
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        ORDER BY t.typname, e.enumsortorder
      `),
    },
    tables: {},
  };

  for (const { tablename } of tables) {
    backup.tables[tablename] = await query(
      `SELECT * FROM ${quoteIdent(tablename)} ORDER BY 1`,
    );
  }

  await client.query("ROLLBACK");

  const stamp = new Date()
    .toISOString()
    .replaceAll(":", "")
    .replaceAll(".", "")
    .replace("T", "-")
    .replace("Z", "");
  const outputPath = path.join(outputDir, `railway-before-ucc-${stamp}.json`);
  await fs.writeFile(outputPath, JSON.stringify(backup, null, 2), "utf8");
  console.log(JSON.stringify({
    outputPath,
    tableCount: Object.keys(backup.tables).length,
    rowCount: Object.values(backup.tables).reduce((sum, rows) => sum + rows.length, 0),
  }, null, 2));
} catch (error) {
  try {
    await client.query("ROLLBACK");
  } catch {}
  throw error;
} finally {
  await client.end();
}
