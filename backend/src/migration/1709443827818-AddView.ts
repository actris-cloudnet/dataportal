import { MigrationInterface, QueryRunner } from "typeorm";

export class AddView1709443827818 implements MigrationInterface {
  name = "AddView1709443827818";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE MATERIALIZED VIEW "instrument_pid_view" AS SELECT DISTINCT "instrumentPid" FROM instrument_upload`,
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      ["public", "MATERIALIZED_VIEW", "instrument_pid_view", 'SELECT DISTINCT "instrumentPid" FROM instrument_upload'],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, [
      "MATERIALIZED_VIEW",
      "instrument_pid_view",
      "public",
    ]);
    await queryRunner.query(`DROP MATERIALIZED VIEW "instrument_pid_view"`);
  }
}
