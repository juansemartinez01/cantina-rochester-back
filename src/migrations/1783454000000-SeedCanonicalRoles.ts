import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCanonicalRoles1783454000000 implements MigrationInterface {
  name = 'SeedCanonicalRoles1783454000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "roles" ("nombre")
      VALUES ('Admin'), ('Vendedor'), ('Cocina')
      ON CONFLICT ("nombre") DO NOTHING
    `);
  }

  public async down(): Promise<void> {
    // Roles may already be assigned to users, so removing them is unsafe.
  }
}
