import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAlmacenToGastos1783448000000 implements MigrationInterface {
  name = 'AddAlmacenToGastos1783448000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "gasto"
        ADD COLUMN IF NOT EXISTS "almacen_id" integer
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_gasto_almacen"
      ON "gasto" ("almacen_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_gasto_almacen'
        ) THEN
          ALTER TABLE "gasto"
          ADD CONSTRAINT "FK_gasto_almacen"
          FOREIGN KEY ("almacen_id")
          REFERENCES "almacen"("id")
          ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_gasto_almacen'
        ) THEN
          ALTER TABLE "gasto" DROP CONSTRAINT "FK_gasto_almacen";
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_gasto_almacen"`);

    await queryRunner.query(`
      ALTER TABLE "gasto"
        DROP COLUMN IF EXISTS "almacen_id"
    `);
  }
}
