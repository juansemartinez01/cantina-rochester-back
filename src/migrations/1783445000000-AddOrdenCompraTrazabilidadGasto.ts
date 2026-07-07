import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrdenCompraTrazabilidadGasto1783445000000
  implements MigrationInterface
{
  name = 'AddOrdenCompraTrazabilidadGasto1783445000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'orden_compra_estado_enum') THEN
          CREATE TYPE "orden_compra_estado_enum" AS ENUM ('ACTIVA', 'ANULADA');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gasto_origen_enum') THEN
          CREATE TYPE "gasto_origen_enum" AS ENUM ('MANUAL', 'ORDEN_COMPRA');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "orden_compra"
        ADD COLUMN IF NOT EXISTS "estado" "orden_compra_estado_enum" NOT NULL DEFAULT 'ACTIVA',
        ADD COLUMN IF NOT EXISTS "gasto_id" integer,
        ADD COLUMN IF NOT EXISTS "numero_comprobante" character varying(120),
        ADD COLUMN IF NOT EXISTS "observacion" text,
        ADD COLUMN IF NOT EXISTS "motivo_anulacion" character varying(500),
        ADD COLUMN IF NOT EXISTS "fecha_anulacion" timestamp
    `);

    await queryRunner.query(`
      ALTER TABLE "gasto"
        ADD COLUMN IF NOT EXISTS "origen" "gasto_origen_enum" NOT NULL DEFAULT 'MANUAL',
        ADD COLUMN IF NOT EXISTS "orden_compra_id" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "movimiento_stock"
        ADD COLUMN IF NOT EXISTS "orden_compra_id" integer,
        ADD COLUMN IF NOT EXISTS "orden_compra_item_id" integer
    `);

    await this.addForeignKeyIfMissing(
      queryRunner,
      'orden_compra',
      'FK_orden_compra_gasto',
      'gasto_id',
      'gasto',
      'id',
    );
    await this.addForeignKeyIfMissing(
      queryRunner,
      'gasto',
      'FK_gasto_orden_compra',
      'orden_compra_id',
      'orden_compra',
      'id',
    );
    await this.addForeignKeyIfMissing(
      queryRunner,
      'movimiento_stock',
      'FK_movimiento_stock_orden_compra',
      'orden_compra_id',
      'orden_compra',
      'id',
    );
    await this.addForeignKeyIfMissing(
      queryRunner,
      'movimiento_stock',
      'FK_movimiento_stock_orden_compra_item',
      'orden_compra_item_id',
      'orden_compra_item',
      'id',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropForeignKeyIfExists(
      queryRunner,
      'movimiento_stock',
      'FK_movimiento_stock_orden_compra_item',
    );
    await this.dropForeignKeyIfExists(
      queryRunner,
      'movimiento_stock',
      'FK_movimiento_stock_orden_compra',
    );
    await this.dropForeignKeyIfExists(
      queryRunner,
      'gasto',
      'FK_gasto_orden_compra',
    );
    await this.dropForeignKeyIfExists(
      queryRunner,
      'orden_compra',
      'FK_orden_compra_gasto',
    );

    await queryRunner.query(`
      ALTER TABLE "movimiento_stock"
        DROP COLUMN IF EXISTS "orden_compra_item_id",
        DROP COLUMN IF EXISTS "orden_compra_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "gasto"
        DROP COLUMN IF EXISTS "orden_compra_id",
        DROP COLUMN IF EXISTS "origen"
    `);
    await queryRunner.query(`
      ALTER TABLE "orden_compra"
        DROP COLUMN IF EXISTS "fecha_anulacion",
        DROP COLUMN IF EXISTS "motivo_anulacion",
        DROP COLUMN IF EXISTS "observacion",
        DROP COLUMN IF EXISTS "numero_comprobante",
        DROP COLUMN IF EXISTS "gasto_id",
        DROP COLUMN IF EXISTS "estado"
    `);

    await queryRunner.query(`DROP TYPE IF EXISTS "gasto_origen_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "orden_compra_estado_enum"`);
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
        ) THEN
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
