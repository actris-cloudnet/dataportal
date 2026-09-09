import { MigrationInterface, QueryRunner } from "typeorm";

export class TruncateDatesToMonthsInDownloadStats1788945661941 implements MigrationInterface {
  name = "TruncateDatesToMonthsInDownloadStats1788945661941";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, [
      "MATERIALIZED_VIEW",
      "download_stats",
      "public",
    ]);
    await queryRunner.query(`DROP MATERIALIZED VIEW "download_stats"`);
    await queryRunner.query(`CREATE MATERIALIZED VIEW "download_stats" AS
    SELECT
      date_trunc('month', "createdAt")::date AS "downloadDate",
      "ip"::inet AS "ip",
      "country",
      "measurementDate",
      "productId",
      "siteId",
      SUM("downloads") AS "downloads"
    FROM download
    JOIN (
      SELECT uuid, "measurementDate", "productId", "siteId", COUNT(*) AS "downloads"
      FROM (
        SELECT uuid, date_trunc('month', "measurementDate")::date AS "measurementDate", "productId", "siteId"
        FROM regular_file
        UNION ALL
        SELECT uuid, date_trunc('month', "measurementDate")::date AS "measurementDate", "productId", "siteId"
        FROM model_file
      ) AS file
      GROUP BY uuid, "measurementDate", "productId", "siteId"
      UNION ALL
      SELECT "collectionUuid" AS uuid, "measurementDate", "productId", "siteId", COUNT(*) AS "downloads"
      FROM (
        SELECT "collectionUuid", date_trunc('month', "measurementDate")::date AS "measurementDate", "productId", "siteId"
        FROM collection_regular_files_regular_file
        JOIN regular_file ON "regularFileUuid" = regular_file.uuid
        UNION ALL
        SELECT "collectionUuid", date_trunc('month', "measurementDate")::date AS "measurementDate", "productId", "siteId"
        FROM collection_model_files_model_file
        JOIN model_file ON "modelFileUuid" = model_file.uuid
      ) AS collection_file
      GROUP BY "collectionUuid", "measurementDate", "productId", "siteId"
    ) object ON "objectUuid" = object.uuid
    GROUP BY "downloadDate", "ip", "country", "measurementDate", "productId", "siteId"
    WITH NO DATA
  `);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        "public",
        "MATERIALIZED_VIEW",
        "download_stats",
        'SELECT\n      date_trunc(\'month\', "createdAt")::date AS "downloadDate",\n      "ip"::inet AS "ip",\n      "country",\n      "measurementDate",\n      "productId",\n      "siteId",\n      SUM("downloads") AS "downloads"\n    FROM download\n    JOIN (\n      SELECT uuid, "measurementDate", "productId", "siteId", COUNT(*) AS "downloads"\n      FROM (\n        SELECT uuid, date_trunc(\'month\', "measurementDate")::date AS "measurementDate", "productId", "siteId"\n        FROM regular_file\n        UNION ALL\n        SELECT uuid, date_trunc(\'month\', "measurementDate")::date AS "measurementDate", "productId", "siteId"\n        FROM model_file\n      ) AS file\n      GROUP BY uuid, "measurementDate", "productId", "siteId"\n      UNION ALL\n      SELECT "collectionUuid" AS uuid, "measurementDate", "productId", "siteId", COUNT(*) AS "downloads"\n      FROM (\n        SELECT "collectionUuid", date_trunc(\'month\', "measurementDate")::date AS "measurementDate", "productId", "siteId"\n        FROM collection_regular_files_regular_file\n        JOIN regular_file ON "regularFileUuid" = regular_file.uuid\n        UNION ALL\n        SELECT "collectionUuid", date_trunc(\'month\', "measurementDate")::date AS "measurementDate", "productId", "siteId"\n        FROM collection_model_files_model_file\n        JOIN model_file ON "modelFileUuid" = model_file.uuid\n      ) AS collection_file\n      GROUP BY "collectionUuid", "measurementDate", "productId", "siteId"\n    ) object ON "objectUuid" = object.uuid\n    GROUP BY "downloadDate", "ip", "country", "measurementDate", "productId", "siteId"',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, [
      "MATERIALIZED_VIEW",
      "download_stats",
      "public",
    ]);
    await queryRunner.query(`DROP MATERIALIZED VIEW "download_stats"`);
    await queryRunner.query(`CREATE MATERIALIZED VIEW "download_stats" AS SELECT
      "createdAt"::date AS "downloadDate",
      "ip",
      "country",
      "measurementDate",
      "productId",
      "siteId",
      SUM("downloads") AS "downloads"
    FROM download
    JOIN (
      SELECT uuid, "measurementDate", "productId", "siteId", COUNT(*) AS "downloads"
      FROM (
        SELECT uuid, "measurementDate", "productId", "siteId"
        FROM regular_file
        UNION ALL
        SELECT uuid, "measurementDate", "productId", "siteId"
        FROM model_file
      ) AS file
      GROUP BY uuid, "measurementDate", "productId", "siteId"
      UNION ALL
      SELECT "collectionUuid" AS uuid, "measurementDate", "productId", "siteId", COUNT(*) AS "downloads"
      FROM (
        SELECT "collectionUuid", "measurementDate", "productId", "siteId"
        FROM collection_regular_files_regular_file
        JOIN regular_file ON "regularFileUuid" = regular_file.uuid
        UNION ALL
        SELECT "collectionUuid", "measurementDate", "productId", "siteId"
        FROM collection_model_files_model_file
        JOIN model_file ON "modelFileUuid" = model_file.uuid
      ) AS collection_file
      GROUP BY "collectionUuid", "measurementDate", "productId", "siteId"
    ) object ON "objectUuid" = object.uuid
    GROUP BY "downloadDate", "ip", "country", "measurementDate", "productId", "siteId"
    WITH NO DATA`);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        "public",
        "MATERIALIZED_VIEW",
        "download_stats",
        'SELECT\n      "createdAt"::date AS "downloadDate",\n      "ip",\n      "country",\n      "measurementDate",\n      "productId",\n      "siteId",\n      SUM("downloads") AS "downloads"\n    FROM download\n    JOIN (\n      SELECT uuid, "measurementDate", "productId", "siteId", COUNT(*) AS "downloads"\n      FROM (\n        SELECT uuid, "measurementDate", "productId", "siteId"\n        FROM regular_file\n        UNION ALL\n        SELECT uuid, "measurementDate", "productId", "siteId"\n        FROM model_file\n      ) AS file\n      GROUP BY uuid, "measurementDate", "productId", "siteId"\n      UNION ALL\n      SELECT "collectionUuid" AS uuid, "measurementDate", "productId", "siteId", COUNT(*) AS "downloads"\n      FROM (\n        SELECT "collectionUuid", "measurementDate", "productId", "siteId"\n        FROM collection_regular_files_regular_file\n        JOIN regular_file ON "regularFileUuid" = regular_file.uuid\n        UNION ALL\n        SELECT "collectionUuid", "measurementDate", "productId", "siteId"\n        FROM collection_model_files_model_file\n        JOIN model_file ON "modelFileUuid" = model_file.uuid\n      ) AS collection_file\n      GROUP BY "collectionUuid", "measurementDate", "productId", "siteId"\n    ) object ON "objectUuid" = object.uuid\n    GROUP BY "downloadDate", "ip", "country", "measurementDate", "productId", "siteId"',
      ],
    );
  }
}
