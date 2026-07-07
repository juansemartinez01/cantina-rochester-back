import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAlmacenToPromociones1783449000000
  implements MigrationInterface
{
  name = 'AddAlmacenToPromociones1783449000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "promocion"
        ADD COLUMN IF NOT EXISTS "almacen_id" integer
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_promocion_almacen"
      ON "promocion" ("almacen_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_promocion_almacen'
        ) THEN
          ALTER TABLE "promocion"
          ADD CONSTRAINT "FK_promocion_almacen"
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
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_promocion_almacen'
        ) THEN
          ALTER TABLE "promocion" DROP CONSTRAINT "FK_promocion_almacen";
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_promocion_almacen"`);

    await queryRunner.query(`
      ALTER TABLE "promocion"
        DROP COLUMN IF EXISTS "almacen_id"
    `);
  }
}
