import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCuentaCorriente1783441000000 implements MigrationInterface {
  name = 'AddCuentaCorriente1783441000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cuenta_corriente_venta_estado_enum') THEN
          CREATE TYPE "cuenta_corriente_venta_estado_enum" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'ANULADA');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cuenta_corriente_pago_medio_pago_enum') THEN
          CREATE TYPE "cuenta_corriente_pago_medio_pago_enum" AS ENUM ('EFECTIVO', 'BANCARIZADO');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cuenta_corriente_movimiento_tipo_enum') THEN
          CREATE TYPE "cuenta_corriente_movimiento_tipo_enum" AS ENUM ('DEUDA', 'PAGO', 'AJUSTE_DEBITO', 'AJUSTE_CREDITO', 'SALDO_A_FAVOR');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cuenta_corriente" (
        "id" SERIAL NOT NULL,
        "nombre" character varying(255) NOT NULL,
        "documento" character varying(50),
        "email" character varying(255),
        "telefono" character varying(50),
        "activa" boolean NOT NULL DEFAULT true,
        "saldo_actual" numeric(12,2) NOT NULL DEFAULT '0',
        "observaciones" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cuenta_corriente" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cuenta_corriente_venta" (
        "id" SERIAL NOT NULL,
        "cuenta_corriente_id" integer NOT NULL,
        "venta_id" integer NOT NULL,
        "monto_original" numeric(12,2) NOT NULL,
        "monto_pagado" numeric(12,2) NOT NULL DEFAULT '0',
        "monto_pendiente" numeric(12,2) NOT NULL,
        "estado" "cuenta_corriente_venta_estado_enum" NOT NULL DEFAULT 'PENDIENTE',
        "fecha" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cuenta_corriente_venta" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cuenta_corriente_pago" (
        "id" SERIAL NOT NULL,
        "cuenta_corriente_id" integer NOT NULL,
        "almacen_id" integer NOT NULL,
        "monto" numeric(12,2) NOT NULL,
        "medio_pago" "cuenta_corriente_pago_medio_pago_enum" NOT NULL,
        "referencia" character varying(120),
        "observacion" character varying(500),
        "usuario_id" integer,
        "fecha" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cuenta_corriente_pago" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cuenta_corriente_pago_aplicacion" (
        "id" SERIAL NOT NULL,
        "pago_id" integer NOT NULL,
        "cuenta_corriente_venta_id" integer NOT NULL,
        "monto_aplicado" numeric(12,2) NOT NULL,
        "fecha" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cuenta_corriente_pago_aplicacion" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cuenta_corriente_movimiento" (
        "id" SERIAL NOT NULL,
        "cuenta_corriente_id" integer NOT NULL,
        "tipo" "cuenta_corriente_movimiento_tipo_enum" NOT NULL,
        "venta_id" integer,
        "pago_id" integer,
        "monto" numeric(12,2) NOT NULL,
        "saldo_resultante" numeric(12,2) NOT NULL,
        "descripcion" character varying(500) NOT NULL,
        "usuario_id" integer,
        "fecha" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cuenta_corriente_movimiento" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cuenta_corriente_activa" ON "cuenta_corriente" ("activa")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cuenta_corriente_documento" ON "cuenta_corriente" ("documento")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cc_venta_cuenta_estado_fecha" ON "cuenta_corriente_venta" ("cuenta_corriente_id", "estado", "fecha")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_cc_venta_venta_id" ON "cuenta_corriente_venta" ("venta_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cc_pago_cuenta_fecha" ON "cuenta_corriente_pago" ("cuenta_corriente_id", "fecha")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cc_pago_almacen_fecha" ON "cuenta_corriente_pago" ("almacen_id", "fecha")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cc_aplicacion_pago" ON "cuenta_corriente_pago_aplicacion" ("pago_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cc_aplicacion_venta" ON "cuenta_corriente_pago_aplicacion" ("cuenta_corriente_venta_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cc_mov_cuenta_fecha" ON "cuenta_corriente_movimiento" ("cuenta_corriente_id", "fecha")`);

    await this.addForeignKeyIfPossible(
      queryRunner,
      'cuenta_corriente_venta',
      'FK_cc_venta_cuenta',
      'cuenta_corriente_id',
      'cuenta_corriente',
      'id',
      'CASCADE',
    );
    await this.addForeignKeyIfPossible(
      queryRunner,
      'cuenta_corriente_venta',
      'FK_cc_venta_venta',
      'venta_id',
      'venta',
      'id',
      'RESTRICT',
    );
    await this.addForeignKeyIfPossible(
      queryRunner,
      'cuenta_corriente_pago',
      'FK_cc_pago_cuenta',
      'cuenta_corriente_id',
      'cuenta_corriente',
      'id',
      'CASCADE',
    );
    await this.addForeignKeyIfPossible(
      queryRunner,
      'cuenta_corriente_pago',
      'FK_cc_pago_almacen',
      'almacen_id',
      'almacen',
      'id',
      'RESTRICT',
    );
    await this.addForeignKeyIfPossible(
      queryRunner,
      'cuenta_corriente_pago',
      'FK_cc_pago_usuario',
      'usuario_id',
      'usuarios',
      'id',
      'SET NULL',
    );
    await this.addForeignKeyIfPossible(
      queryRunner,
      'cuenta_corriente_pago_aplicacion',
      'FK_cc_aplicacion_pago',
      'pago_id',
      'cuenta_corriente_pago',
      'id',
      'CASCADE',
    );
    await this.addForeignKeyIfPossible(
      queryRunner,
      'cuenta_corriente_pago_aplicacion',
      'FK_cc_aplicacion_venta',
      'cuenta_corriente_venta_id',
      'cuenta_corriente_venta',
      'id',
      'CASCADE',
    );
    await this.addForeignKeyIfPossible(
      queryRunner,
      'cuenta_corriente_movimiento',
      'FK_cc_mov_cuenta',
      'cuenta_corriente_id',
      'cuenta_corriente',
      'id',
      'CASCADE',
    );
    await this.addForeignKeyIfPossible(
      queryRunner,
      'cuenta_corriente_movimiento',
      'FK_cc_mov_venta',
      'venta_id',
      'venta',
      'id',
      'SET NULL',
    );
    await this.addForeignKeyIfPossible(
      queryRunner,
      'cuenta_corriente_movimiento',
      'FK_cc_mov_pago',
      'pago_id',
      'cuenta_corriente_pago',
      'id',
      'SET NULL',
    );
    await this.addForeignKeyIfPossible(
      queryRunner,
      'cuenta_corriente_movimiento',
      'FK_cc_mov_usuario',
      'usuario_id',
      'usuarios',
      'id',
      'SET NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cuenta_corriente_movimiento" DROP CONSTRAINT IF EXISTS "FK_cc_mov_usuario"`);
    await queryRunner.query(`ALTER TABLE "cuenta_corriente_movimiento" DROP CONSTRAINT IF EXISTS "FK_cc_mov_pago"`);
    await queryRunner.query(`ALTER TABLE "cuenta_corriente_movimiento" DROP CONSTRAINT IF EXISTS "FK_cc_mov_venta"`);
    await queryRunner.query(`ALTER TABLE "cuenta_corriente_movimiento" DROP CONSTRAINT IF EXISTS "FK_cc_mov_cuenta"`);
    await queryRunner.query(`ALTER TABLE "cuenta_corriente_pago_aplicacion" DROP CONSTRAINT IF EXISTS "FK_cc_aplicacion_venta"`);
    await queryRunner.query(`ALTER TABLE "cuenta_corriente_pago_aplicacion" DROP CONSTRAINT IF EXISTS "FK_cc_aplicacion_pago"`);
    await queryRunner.query(`ALTER TABLE "cuenta_corriente_pago" DROP CONSTRAINT IF EXISTS "FK_cc_pago_usuario"`);
    await queryRunner.query(`ALTER TABLE "cuenta_corriente_pago" DROP CONSTRAINT IF EXISTS "FK_cc_pago_almacen"`);
    await queryRunner.query(`ALTER TABLE "cuenta_corriente_pago" DROP CONSTRAINT IF EXISTS "FK_cc_pago_cuenta"`);
    await queryRunner.query(`ALTER TABLE "cuenta_corriente_venta" DROP CONSTRAINT IF EXISTS "FK_cc_venta_venta"`);
    await queryRunner.query(`ALTER TABLE "cuenta_corriente_venta" DROP CONSTRAINT IF EXISTS "FK_cc_venta_cuenta"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cc_mov_cuenta_fecha"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cc_aplicacion_venta"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cc_aplicacion_pago"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cc_pago_almacen_fecha"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cc_pago_cuenta_fecha"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_cc_venta_venta_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cc_venta_cuenta_estado_fecha"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cuenta_corriente_documento"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cuenta_corriente_activa"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cuenta_corriente_movimiento"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cuenta_corriente_pago_aplicacion"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cuenta_corriente_pago"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cuenta_corriente_venta"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cuenta_corriente"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "cuenta_corriente_movimiento_tipo_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "cuenta_corriente_pago_medio_pago_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "cuenta_corriente_venta_estado_enum"`);
  }

  private async addForeignKeyIfPossible(
    queryRunner: QueryRunner,
    table: string,
    constraint: string,
    column: string,
    referencedTable: string,
    referencedColumn: string,
    onDelete: 'CASCADE' | 'RESTRICT' | 'SET NULL',
  ): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = '${constraint}'
        ) AND to_regclass('public.${referencedTable}') IS NOT NULL THEN
          ALTER TABLE "${table}"
          ADD CONSTRAINT "${constraint}"
          FOREIGN KEY ("${column}") REFERENCES "${referencedTable}"("${referencedColumn}")
          ON DELETE ${onDelete} ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }
}
