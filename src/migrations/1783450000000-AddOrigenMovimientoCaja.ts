import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrigenMovimientoCaja1783450000000
  implements MigrationInterface
{
  name = 'AddOrigenMovimientoCaja1783450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movimiento_caja_origen_enum') THEN
          CREATE TYPE "movimiento_caja_origen_enum" AS ENUM ('MANUAL', 'CUENTA_CORRIENTE');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "movimiento_caja"
        ADD COLUMN IF NOT EXISTS "origen" "movimiento_caja_origen_enum" NOT NULL DEFAULT 'MANUAL',
        ADD COLUMN IF NOT EXISTS "cuenta_corriente_pago_id" integer
    `);

    await this.addForeignKeyIfMissing(
      queryRunner,
      'movimiento_caja',
      'FK_movimiento_caja_cuenta_corriente_pago',
      'cuenta_corriente_pago_id',
      'cuenta_corriente_pago',
      'id',
    );

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_movimiento_caja_caja_origen_medio_fecha"
      ON "movimiento_caja" ("caja_id", "origen", "medio_pago", "fecha")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_movimiento_caja_cc_pago"
      ON "movimiento_caja" ("cuenta_corriente_pago_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_movimiento_caja_cc_pago"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_movimiento_caja_caja_origen_medio_fecha"`,
    );
    await this.dropForeignKeyIfExists(
      queryRunner,
      'movimiento_caja',
      'FK_movimiento_caja_cuenta_corriente_pago',
    );

    await queryRunner.query(`
      ALTER TABLE "movimiento_caja"
        DROP COLUMN IF EXISTS "cuenta_corriente_pago_id",
        DROP COLUMN IF EXISTS "origen"
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "movimiento_caja_origen_enum"`);
  }

  private async addForeignKeyIfMissing(
    queryRunner: QueryRunner,
    table: string,
    constraint: string,
    column: string,
    referencedTable: string,
    referencedColumn: string,
  ): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = '${constraint}'
        ) AND to_regclass('public.${referencedTable}') IS NOT NULL THEN
          ALTER TABLE "${table}"
          ADD CONSTRAINT "${constraint}"
          FOREIGN KEY ("${column}")
          REFERENCES "${referencedTable}"("${referencedColumn}")
          ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);
  }

  private async dropForeignKeyIfExists(
    queryRunner: QueryRunner,
    table: string,
    constraint: string,
  ): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = '${constraint}'
        ) THEN
          ALTER TABLE "${table}" DROP CONSTRAINT "${constraint}";
        END IF;
      END
      $$;
    `);
  }
}
