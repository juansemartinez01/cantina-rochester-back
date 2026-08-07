import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetodoPagoQr1783452000000 implements MigrationInterface {
  name = 'AddMetodoPagoQr1783452000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addEnumValue(queryRunner, 'ingreso_venta_tipo_enum', 'QR');
    await this.addEnumValue(
      queryRunner,
      'cuenta_corriente_pago_medio_pago_enum',
      'QR',
    );
    await this.addEnumValue(
      queryRunner,
      'movimiento_caja_medio_pago_enum',
      'QR',
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL enum values cannot be removed safely without rebuilding columns.
  }

  private async addEnumValue(
    queryRunner: QueryRunner,
    enumName: string,
    value: string,
  ): Promise<void> {
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
