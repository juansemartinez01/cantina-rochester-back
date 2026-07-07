import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetodosPagoDetallados1783444000000
  implements MigrationInterface
{
  name = 'AddMetodosPagoDetallados1783444000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addValues(queryRunner, 'ingreso_venta_tipo_enum');
    await this.addValues(queryRunner, 'cuenta_corriente_pago_medio_pago_enum');
    await this.addValues(queryRunner, 'movimiento_caja_medio_pago_enum');
  }

  public async down(): Promise<void> {
    // PostgreSQL enum values cannot be removed safely without rebuilding columns.
  }

  private async addValues(
    queryRunner: QueryRunner,
    enumName: string,
  ): Promise<void> {
    for (const value of ['TRANSFERENCIA', 'DEBITO', 'CREDITO']) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF to_regtype('${enumName}') IS NOT NULL THEN
            ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS '${value}';
          END IF;
        END
        $$;
      `);
    }
  }
}
