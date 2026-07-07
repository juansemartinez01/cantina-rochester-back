import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVentaAjustes1783440000000 implements MigrationInterface {
  name = 'AddVentaAjustes1783440000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "venta"
      ADD COLUMN IF NOT EXISTS "subtotal" numeric(12,2) NOT NULL DEFAULT '0'
    `);
    await queryRunner.query(`
      ALTER TABLE "venta"
      ADD COLUMN IF NOT EXISTS "total_descuentos" numeric(12,2) NOT NULL DEFAULT '0'
    `);
    await queryRunner.query(`
      ALTER TABLE "venta"
      ADD COLUMN IF NOT EXISTS "total_recargos" numeric(12,2) NOT NULL DEFAULT '0'
    `);
    await queryRunner.query(`
      UPDATE "venta"
      SET "subtotal" = "total"
      WHERE "subtotal" = 0
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'venta_ajuste_tipo_enum') THEN
          CREATE TYPE "venta_ajuste_tipo_enum" AS ENUM ('DESCUENTO', 'RECARGO');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'venta_ajuste_modo_enum') THEN
          CREATE TYPE "venta_ajuste_modo_enum" AS ENUM ('PORCENTAJE', 'MONTO');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'venta_ajuste_origen_enum') THEN
          CREATE TYPE "venta_ajuste_origen_enum" AS ENUM ('MANUAL', 'REGLA', 'MEDIO_PAGO');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "venta_ajuste" (
        "id" SERIAL NOT NULL,
        "venta_id" integer NOT NULL,
        "tipo" "venta_ajuste_tipo_enum" NOT NULL,
        "modo" "venta_ajuste_modo_enum" NOT NULL,
        "valor" numeric(12,2) NOT NULL,
        "monto_aplicado" numeric(12,2) NOT NULL,
        "motivo" character varying(500) NOT NULL,
        "codigo" character varying(80),
        "origen" "venta_ajuste_origen_enum" NOT NULL DEFAULT 'MANUAL',
        "usuario_id" integer,
        "fecha" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_venta_ajuste" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_venta_ajuste_venta_id"
      ON "venta_ajuste" ("venta_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_venta_ajuste_usuario_id"
      ON "venta_ajuste" ("usuario_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_venta_ajuste_venta'
        ) THEN
          ALTER TABLE "venta_ajuste"
          ADD CONSTRAINT "FK_venta_ajuste_venta"
          FOREIGN KEY ("venta_id") REFERENCES "venta"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_venta_ajuste_usuario'
        ) AND to_regclass('public.usuarios') IS NOT NULL THEN
          ALTER TABLE "venta_ajuste"
          ADD CONSTRAINT "FK_venta_ajuste_usuario"
          FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "venta_ajuste"
      DROP CONSTRAINT IF EXISTS "FK_venta_ajuste_usuario"
    `);
    await queryRunner.query(`
      ALTER TABLE "venta_ajuste"
      DROP CONSTRAINT IF EXISTS "FK_venta_ajuste_venta"
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_venta_ajuste_usuario_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_venta_ajuste_venta_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "venta_ajuste"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "venta_ajuste_origen_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "venta_ajuste_modo_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "venta_ajuste_tipo_enum"`);
    await queryRunner.query(`ALTER TABLE "venta" DROP COLUMN IF EXISTS "total_recargos"`);
    await queryRunner.query(`ALTER TABLE "venta" DROP COLUMN IF EXISTS "total_descuentos"`);
    await queryRunner.query(`ALTER TABLE "venta" DROP COLUMN IF EXISTS "subtotal"`);
  }
}
