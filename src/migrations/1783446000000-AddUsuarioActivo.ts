import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsuarioActivo1783446000000 implements MigrationInterface {
  name = 'AddUsuarioActivo1783446000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "usuarios"
        ADD COLUMN IF NOT EXISTS "activo" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      UPDATE "usuarios"
      SET "activo" = true
      WHERE "activo" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "usuarios"
        DROP COLUMN IF EXISTS "activo"
    `);
  }
}
