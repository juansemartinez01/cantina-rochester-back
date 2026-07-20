import dataSource from 'src/data-source';

const BASELINE_MIGRATIONS = [
  { timestamp: 1747320849857, name: 'InitSchema1747320849857' },
  { timestamp: 1783440000000, name: 'AddVentaAjustes1783440000000' },
  { timestamp: 1783441000000, name: 'AddCuentaCorriente1783441000000' },
  {
    timestamp: 1783442000000,
    name: 'AddMedioPagoMovimientoCaja1783442000000',
  },
  { timestamp: 1783443000000, name: 'AddTipoCobroVenta1783443000000' },
  {
    timestamp: 1783444000000,
    name: 'AddMetodosPagoDetallados1783444000000',
  },
  {
    timestamp: 1783445000000,
    name: 'AddOrdenCompraTrazabilidadGasto1783445000000',
  },
  { timestamp: 1783446000000, name: 'AddUsuarioActivo1783446000000' },
  { timestamp: 1783447000000, name: 'AddGastoCategorias1783447000000' },
  { timestamp: 1783448000000, name: 'AddAlmacenToGastos1783448000000' },
  {
    timestamp: 1783449000000,
    name: 'AddAlmacenToPromociones1783449000000',
  },
];

const BASELINE_SCHEMA_TABLES = [
  'venta',
  'producto',
  'movimiento_caja',
  'cuenta_corriente',
];

export function isRailwayDeploy(): boolean {
  return !!process.env.RAILWAY_ENVIRONMENT_NAME || !!process.env.RAILWAY_PROJECT_ID;
}

export function shouldRunDatabaseMigrations(): boolean {
  return process.env.DB_MIGRATIONS_RUN === 'true' || isRailwayDeploy();
}

export function shouldSynchronizeSchema(): boolean {
  if (process.env.DB_SYNCHRONIZE !== undefined) {
    return process.env.DB_SYNCHRONIZE === 'true';
  }

  return !isRailwayDeploy();
}

export async function ensureMigrationBaseline(): Promise<void> {
  if (!shouldRunDatabaseMigrations()) return;
  if (process.env.DB_MIGRATIONS_BASELINE === 'false') return;

  dataSource.setOptions({
    synchronize: false,
    migrationsRun: false,
  });

  await dataSource.initialize();

  try {
    const hasExistingSchema = await hasBaselineSchema();
    if (!hasExistingSchema) {
      console.log('[migrations] Existing schema not detected; baseline skipped.');
      return;
    }

    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS "migrations" (
        "id" SERIAL NOT NULL,
        "timestamp" bigint NOT NULL,
        "name" character varying NOT NULL,
        CONSTRAINT "PK_migrations" PRIMARY KEY ("id")
      )
    `);

    for (const migration of BASELINE_MIGRATIONS) {
      await dataSource.query(
        `
          INSERT INTO "migrations" ("timestamp", "name")
          SELECT $1::bigint, $2::varchar
          WHERE NOT EXISTS (
            SELECT 1
            FROM "migrations"
            WHERE "timestamp" = $1::bigint OR "name" = $2::varchar
          )
        `,
        [migration.timestamp, migration.name],
      );
    }

    console.log('[migrations] Baseline migrations are registered.');
  } finally {
    await dataSource.destroy();
  }
}

async function hasBaselineSchema(): Promise<boolean> {
  const rows = await dataSource.query(
    `
      SELECT COUNT(*)::int AS count
      FROM unnest($1::text[]) AS table_name
      WHERE to_regclass('public.' || table_name) IS NOT NULL
    `,
    [BASELINE_SCHEMA_TABLES],
  );

  return Number(rows?.[0]?.count ?? 0) === BASELINE_SCHEMA_TABLES.length;
}
