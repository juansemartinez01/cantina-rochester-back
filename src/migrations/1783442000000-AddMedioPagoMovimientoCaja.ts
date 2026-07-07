import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMedioPagoMovimientoCaja1783442000000
  implements MigrationInterface
{
  name = 'AddMedioPagoMovimientoCaja1783442000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movimiento_caja_medio_pago_enum') THEN
          CREATE TYPE "movimiento_caja_medio_pago_enum" AS ENUM ('EFECTIVO', 'BANCARIZADO');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "movimiento_caja"
      ADD COLUMN IF NOT EXISTS "medio_pago" "movimiento_caja_medio_pago_enum" NOT NULL DEFAULT 'EFECTIVO'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "movimiento_caja"
      DROP COLUMN IF EXISTS "medio_pago"
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "movimiento_caja_medio_pago_enum"`);
  }
}
