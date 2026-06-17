import { DataSource } from 'typeorm';
import appDataSource from '../data-source';

async function main() {
  const dataSource = new DataSource({
    ...appDataSource.options,
    synchronize: false,
    migrationsRun: false,
    logging: false,
  });

  try {
    await dataSource.initialize();

    const sqlInMemory = await dataSource.driver
      .createSchemaBuilder()
      .log();
    const pendingQueries = sqlInMemory.upQueries
      .map((query) => query.query.trim())
      .filter(Boolean);

    if (pendingQueries.length === 0) {
      console.log('OK: la base de datos coincide con las entidades.');
      return;
    }

    console.error(
      `La base no coincide con las entidades. TypeORM aplicaria ${pendingQueries.length} query(s):`,
    );

    pendingQueries.forEach((query, index) => {
      console.error(`\n-- Query ${index + 1}`);
      console.error(query);
    });

    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

main().catch((error: unknown) => {
  console.error('No se pudo verificar el schema de la base.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(2);
});
