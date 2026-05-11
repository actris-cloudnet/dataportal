import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstrumentLatestSiteView1778494283020 implements MigrationInterface {
  name = "AddInstrumentLatestSiteView1778494283020";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE MATERIALIZED VIEW "instrument_latest_site" AS
    SELECT DISTINCT ON ("instrumentInfoUuid")
      "instrumentInfoUuid",
      "siteId",
      "measurementDate" AS "latestMeasurementDate"
    FROM instrument_upload
    WHERE "measurementDate" > CURRENT_DATE - 182
    ORDER BY "instrumentInfoUuid", "measurementDate" DESC
  `);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        "public",
        "MATERIALIZED_VIEW",
        "instrument_latest_site",
        'SELECT DISTINCT ON ("instrumentInfoUuid")\n      "instrumentInfoUuid",\n      "siteId",\n      "measurementDate" AS "latestMeasurementDate"\n    FROM instrument_upload\n    WHERE "measurementDate" > CURRENT_DATE - 182\n    ORDER BY "instrumentInfoUuid", "measurementDate" DESC',
      ],
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_instrument_latest_site_uuid" ON "instrument_latest_site" ("instrumentInfoUuid")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, [
      "MATERIALIZED_VIEW",
      "instrument_latest_site",
      "public",
    ]);
    await queryRunner.query(`DROP MATERIALIZED VIEW "instrument_latest_site"`);
  }
}
