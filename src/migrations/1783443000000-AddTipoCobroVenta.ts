import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTipoCobroVenta1783443000000 implements MigrationInterface {
  name = 'AddTipoCobroVenta1783443000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "venta"
      ADD COLUMN IF NOT EXISTS "tipo_cobro" character varying(30) NOT NULL DEFAULT 'CONTADO'
    `);
    await queryRunner.query(`
      ALTER TABLE "venta"
      ADD COLUMN IF NOT EXISTS "cuenta_corriente_id" integer
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_venta_tipo_cobro"
      ON "venta" ("tipo_cobro")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_venta_cuenta_corriente_id"
      ON "venta" ("cuenta_corriente_id")
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_venta_cuenta_corriente'
        ) AND to_regclass('public.cuenta_corriente') IS NOT NULL THEN
          ALTER TABLE "venta"
          ADD CONSTRAINT "FK_venta_cuenta_corriente"
          FOREIGN KEY ("cuenta_corriente_id") REFERENCES "cuenta_corriente"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "venta"
      DROP CONSTRAINT IF EXISTS "FK_venta_cuenta_corriente"
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_venta_cuenta_corriente_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_venta_tipo_cobro"`);
    await queryRunner.query(`
      ALTER TABLE "venta"
      DROP COLUMN IF EXISTS "cuenta_corriente_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "venta"
      DROP COLUMN IF EXISTS "tipo_cobro"
    `);
  }
}
