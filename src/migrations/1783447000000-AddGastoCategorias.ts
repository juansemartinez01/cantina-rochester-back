import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGastoCategorias1783447000000 implements MigrationInterface {
  name = 'AddGastoCategorias1783447000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "gasto_categoria" (
        "id" SERIAL NOT NULL,
        "nombre" character varying(100) NOT NULL,
        "descripcion" character varying(255),
        "activo" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_gasto_categoria" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_gasto_categoria_nombre" UNIQUE ("nombre")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "gasto"
        ADD COLUMN IF NOT EXISTS "categoria_id" integer
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_gasto_categoria"
      ON "gasto" ("categoria_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_gasto_categoria'
        ) THEN
          ALTER TABLE "gasto"
          ADD CONSTRAINT "FK_gasto_categoria"
          FOREIGN KEY ("categoria_id")
          REFERENCES "gasto_categoria"("id")
          ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_gasto_categoria'
        ) THEN
          ALTER TABLE "gasto" DROP CONSTRAINT "FK_gasto_categoria";
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_gasto_categoria"`);

    await queryRunner.query(`
      ALTER TABLE "gasto"
        DROP COLUMN IF EXISTS "categoria_id"
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "gasto_categoria"`);
  }
}
