import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetodoPagoOtro1783451000000 implements MigrationInterface {
  name = 'AddMetodoPagoOtro1783451000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addEnumValue(queryRunner, 'ingreso_venta_tipo_enum', 'OTRO');
    await this.addEnumValue(
      queryRunner,
      'cuenta_corriente_pago_medio_pago_enum',
      'OTRO',
    );
    await this.addEnumValue(
      queryRunner,
      'movimiento_caja_medio_pago_enum',
      'OTRO',
    );

    await this.addDetallePagoColumn(queryRunner, 'ingreso_venta');
    await this.addDetallePagoColumn(queryRunner, 'cuenta_corriente_pago');
    await this.addDetallePagoColumn(queryRunner, 'movimiento_caja');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropDetallePagoColumn(queryRunner, 'movimiento_caja');
    await this.dropDetallePagoColumn(queryRunner, 'cuenta_corriente_pago');
    await this.dropDetallePagoColumn(queryRunner, 'ingreso_venta');
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

  private async addDetallePagoColumn(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.${tableName}') IS NOT NULL THEN
          ALTER TABLE "${tableName}"
            ADD COLUMN IF NOT EXISTS "detalle_pago" character varying(120);
        END IF;
      END
      $$;
    `);
  }

  private async dropDetallePagoColumn(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.${tableName}') IS NOT NULL THEN
          ALTER TABLE "${tableName}"
            DROP COLUMN IF EXISTS "detalle_pago";
        END IF;
      END
      $$;
    `);
  }
}
