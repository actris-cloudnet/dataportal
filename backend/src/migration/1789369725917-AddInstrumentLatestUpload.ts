import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstrumentLatestUpload1789369725917 implements MigrationInterface {
  name = "AddInstrumentLatestUpload1789369725917";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE MATERIALIZED VIEW "instrument_latest_upload" AS
    SELECT instrument_info.uuid AS "instrumentInfoUuid",
      "siteId",
      MAX(instrument_upload."measurementDate") AS "measurementDate"
    FROM instrument_info
    JOIN instrument_upload ON instrument_upload."instrumentInfoUuid" = instrument_info.uuid
    WHERE instrument_upload.status IN ('uploaded', 'processed')
    GROUP BY "siteId", instrument_info.uuid
    WITH NO DATA
  `);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        "public",
        "MATERIALIZED_VIEW",
        "instrument_latest_upload",
        'SELECT instrument_info.uuid AS "instrumentInfoUuid",\n      "siteId",\n      MAX(instrument_upload."measurementDate") AS "measurementDate"\n    FROM instrument_info\n    JOIN instrument_upload ON instrument_upload."instrumentInfoUuid" = instrument_info.uuid\n    WHERE instrument_upload.status IN (\'uploaded\', \'processed\')\n    GROUP BY "siteId", instrument_info.uuid',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, [
      "MATERIALIZED_VIEW",
      "instrument_latest_upload",
      "public",
    ]);
    await queryRunner.query(`DROP MATERIALIZED VIEW "instrument_latest_upload"`);
  }
}
