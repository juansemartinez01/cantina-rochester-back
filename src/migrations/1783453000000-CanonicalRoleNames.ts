import { MigrationInterface, QueryRunner } from 'typeorm';

export class CanonicalRoleNames1783453000000 implements MigrationInterface {
  name = 'CanonicalRoleNames1783453000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.roles') IS NULL OR to_regclass('public.usuario_rol') IS NULL THEN
          RETURN;
        END IF;

        INSERT INTO "roles" ("nombre")
        VALUES ('Admin'), ('Vendedor'), ('Cocina')
        ON CONFLICT ("nombre") DO NOTHING;

        INSERT INTO "usuario_rol" ("usuario_id", "rol_id")
        SELECT DISTINCT ur."usuario_id", target."id"
        FROM "usuario_rol" ur
        INNER JOIN "roles" source ON source."id" = ur."rol_id"
        INNER JOIN "roles" target ON target."nombre" = 'Admin'
        WHERE lower(trim(source."nombre")) IN ('admin', 'administrador', 'supervisor')
          AND source."nombre" <> 'Admin'
          AND NOT EXISTS (
            SELECT 1
            FROM "usuario_rol" existing
            WHERE existing."usuario_id" = ur."usuario_id"
              AND existing."rol_id" = target."id"
          );

        INSERT INTO "usuario_rol" ("usuario_id", "rol_id")
        SELECT DISTINCT ur."usuario_id", target."id"
        FROM "usuario_rol" ur
        INNER JOIN "roles" source ON source."id" = ur."rol_id"
        INNER JOIN "roles" target ON target."nombre" = 'Vendedor'
        WHERE lower(trim(source."nombre")) IN ('operador_caja', 'vendedor')
          AND source."nombre" <> 'Vendedor'
          AND NOT EXISTS (
            SELECT 1
            FROM "usuario_rol" existing
            WHERE existing."usuario_id" = ur."usuario_id"
              AND existing."rol_id" = target."id"
          );

        INSERT INTO "usuario_rol" ("usuario_id", "rol_id")
        SELECT DISTINCT ur."usuario_id", target."id"
        FROM "usuario_rol" ur
        INNER JOIN "roles" source ON source."id" = ur."rol_id"
        INNER JOIN "roles" target ON target."nombre" = 'Cocina'
        WHERE lower(trim(source."nombre")) = 'cocina'
          AND source."nombre" <> 'Cocina'
          AND NOT EXISTS (
            SELECT 1
            FROM "usuario_rol" existing
            WHERE existing."usuario_id" = ur."usuario_id"
              AND existing."rol_id" = target."id"
          );

        DELETE FROM "usuario_rol" ur
        USING "roles" source
        WHERE ur."rol_id" = source."id"
          AND lower(trim(source."nombre")) IN ('admin', 'administrador', 'supervisor', 'operador_caja', 'vendedor', 'cocina')
          AND source."nombre" NOT IN ('Admin', 'Vendedor', 'Cocina');

        DELETE FROM "roles" source
        WHERE lower(trim(source."nombre")) IN ('admin', 'administrador', 'supervisor', 'operador_caja', 'vendedor', 'cocina')
          AND source."nombre" NOT IN ('Admin', 'Vendedor', 'Cocina')
          AND NOT EXISTS (
            SELECT 1 FROM "usuario_rol" ur WHERE ur."rol_id" = source."id"
          );
      END
      $$;
    `);
  }

  public async down(): Promise<void> {
    // This data migration merges legacy roles into canonical role names.
    // It cannot safely reconstruct each user's original legacy roles.
  }
}
