import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveFilterFromDownloadStats1732801567740 implements MigrationInterface {
  name = "RemoveFilterFromDownloadStats1732801567740";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, [
      "MATERIALIZED_VIEW",
      "download_stats",
      "public",
    ]);
    await queryRunner.query(`DROP MATERIALIZED VIEW "download_stats"`);
    await queryRunner.query(`CREATE MATERIALIZED VIEW "download_stats" AS
    SELECT
      "createdAt"::date AS "downloadDate",
      "ip",
      "country",
      "measurementDate",
      "productType",
      "siteId",
      SUM("downloads") AS "downloads"
    FROM download
    JOIN (
      SELECT uuid, "measurementDate", "productType", "siteId", COUNT(*) AS "downloads"
      FROM (
        SELECT uuid, "measurementDate", 'observation' AS "productType", "siteId"
        FROM regular_file
        JOIN product_variable USING ("productId")
        WHERE product_variable."actrisName" IS NOT NULL
        UNION ALL
        SELECT uuid, "measurementDate", 'model' AS "productType", "siteId"
        FROM model_file
        JOIN product_variable USING ("productId")
        WHERE product_variable."actrisName" IS NOT NULL
      ) AS file
      GROUP BY uuid, "measurementDate", "productType", "siteId"
      UNION ALL
      SELECT "collectionUuid" AS uuid, "measurementDate", "productType", "siteId", COUNT(*) AS "downloads"
      FROM (
        SELECT "collectionUuid", "measurementDate", 'observation' AS "productType", "siteId"
        FROM collection_regular_files_regular_file
        JOIN regular_file ON "regularFileUuid" = regular_file.uuid
        JOIN product_variable USING ("productId")
        WHERE product_variable."actrisName" IS NOT NULL
        UNION ALL
        SELECT "collectionUuid", "measurementDate", 'model' AS "productType", "siteId"
        FROM collection_model_files_model_file
        JOIN model_file ON "modelFileUuid" = model_file.uuid
        JOIN product_variable USING ("productId")
        WHERE product_variable."actrisName" IS NOT NULL
      ) AS collection_file
      GROUP BY "collectionUuid", "measurementDate", "productType", "siteId"
    ) object ON "objectUuid" = object.uuid
    GROUP BY "downloadDate", "ip", "country", "measurementDate", "productType", "siteId"
  `);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        "public",
        "MATERIALIZED_VIEW",
        "download_stats",
        'SELECT\n      "createdAt"::date AS "downloadDate",\n      "ip",\n      "country",\n      "measurementDate",\n      "productType",\n      "siteId",\n      SUM("downloads") AS "downloads"\n    FROM download\n    JOIN (\n      SELECT uuid, "measurementDate", "productType", "siteId", COUNT(*) AS "downloads"\n      FROM (\n        SELECT uuid, "measurementDate", \'observation\' AS "productType", "siteId"\n        FROM regular_file\n        JOIN product_variable USING ("productId")\n        WHERE product_variable."actrisName" IS NOT NULL\n        UNION ALL\n        SELECT uuid, "measurementDate", \'model\' AS "productType", "siteId"\n        FROM model_file\n        JOIN product_variable USING ("productId")\n        WHERE product_variable."actrisName" IS NOT NULL\n      ) AS file\n      GROUP BY uuid, "measurementDate", "productType", "siteId"\n      UNION ALL\n      SELECT "collectionUuid" AS uuid, "measurementDate", "productType", "siteId", COUNT(*) AS "downloads"\n      FROM (\n        SELECT "collectionUuid", "measurementDate", \'observation\' AS "productType", "siteId"\n        FROM collection_regular_files_regular_file\n        JOIN regular_file ON "regularFileUuid" = regular_file.uuid\n        JOIN product_variable USING ("productId")\n        WHERE product_variable."actrisName" IS NOT NULL\n        UNION ALL\n        SELECT "collectionUuid", "measurementDate", \'model\' AS "productType", "siteId"\n        FROM collection_model_files_model_file\n        JOIN model_file ON "modelFileUuid" = model_file.uuid\n        JOIN product_variable USING ("productId")\n        WHERE product_variable."actrisName" IS NOT NULL\n      ) AS collection_file\n      GROUP BY "collectionUuid", "measurementDate", "productType", "siteId"\n    ) object ON "objectUuid" = object.uuid\n    GROUP BY "downloadDate", "ip", "country", "measurementDate", "productType", "siteId"',
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
      "productType",
      "siteId",
      SUM("downloads") AS "downloads"
    FROM download
    JOIN (
      SELECT uuid, "measurementDate", "productType", "siteId", COUNT(*) AS "downloads"
      FROM (
        SELECT uuid, "measurementDate", 'observation' AS "productType", "siteId"
        FROM regular_file
        JOIN product_variable USING ("productId")
        WHERE product_variable."actrisName" IS NOT NULL
        UNION ALL
        SELECT uuid, "measurementDate", 'model' AS "productType", "siteId"
        FROM model_file
        JOIN product_variable USING ("productId")
        WHERE product_variable."actrisName" IS NOT NULL
      ) AS file
      GROUP BY uuid, "measurementDate", "productType", "siteId"
      UNION ALL
      SELECT "collectionUuid" AS uuid, "measurementDate", "productType", "siteId", COUNT(*) AS "downloads"
      FROM (
        SELECT "collectionUuid", "measurementDate", 'observation' AS "productType", "siteId"
        FROM collection_regular_files_regular_file
        JOIN regular_file ON "regularFileUuid" = regular_file.uuid
        JOIN product_variable USING ("productId")
        WHERE product_variable."actrisName" IS NOT NULL
        UNION ALL
        SELECT "collectionUuid", "measurementDate", 'model' AS "productType", "siteId"
        FROM collection_model_files_model_file
        JOIN model_file ON "modelFileUuid" = model_file.uuid
        JOIN product_variable USING ("productId")
        WHERE product_variable."actrisName" IS NOT NULL
      ) AS collection_file
      GROUP BY "collectionUuid", "measurementDate", "productType", "siteId"
    ) object ON "objectUuid" = object.uuid
    WHERE
      ip NOT IN ('', '::ffff:127.0.0.1')
      AND ip NOT LIKE '192.168.%'
      AND ip NOT LIKE '193.166.223.%'
    GROUP BY "downloadDate", "ip", "country", "measurementDate", "productType", "siteId"`);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        "public",
        "MATERIALIZED_VIEW",
        "download_stats",
        'SELECT\n      "createdAt"::date AS "downloadDate",\n      "ip",\n      "country",\n      "measurementDate",\n      "productType",\n      "siteId",\n      SUM("downloads") AS "downloads"\n    FROM download\n    JOIN (\n      SELECT uuid, "measurementDate", "productType", "siteId", COUNT(*) AS "downloads"\n      FROM (\n        SELECT uuid, "measurementDate", \'observation\' AS "productType", "siteId"\n        FROM regular_file\n        JOIN product_variable USING ("productId")\n        WHERE product_variable."actrisName" IS NOT NULL\n        UNION ALL\n        SELECT uuid, "measurementDate", \'model\' AS "productType", "siteId"\n        FROM model_file\n        JOIN product_variable USING ("productId")\n        WHERE product_variable."actrisName" IS NOT NULL\n      ) AS file\n      GROUP BY uuid, "measurementDate", "productType", "siteId"\n      UNION ALL\n      SELECT "collectionUuid" AS uuid, "measurementDate", "productType", "siteId", COUNT(*) AS "downloads"\n      FROM (\n        SELECT "collectionUuid", "measurementDate", \'observation\' AS "productType", "siteId"\n        FROM collection_regular_files_regular_file\n        JOIN regular_file ON "regularFileUuid" = regular_file.uuid\n        JOIN product_variable USING ("productId")\n        WHERE product_variable."actrisName" IS NOT NULL\n        UNION ALL\n        SELECT "collectionUuid", "measurementDate", \'model\' AS "productType", "siteId"\n        FROM collection_model_files_model_file\n        JOIN model_file ON "modelFileUuid" = model_file.uuid\n        JOIN product_variable USING ("productId")\n        WHERE product_variable."actrisName" IS NOT NULL\n      ) AS collection_file\n      GROUP BY "collectionUuid", "measurementDate", "productType", "siteId"\n    ) object ON "objectUuid" = object.uuid\n    WHERE\n      ip NOT IN (\'\', \'::ffff:127.0.0.1\')\n      AND ip NOT LIKE \'192.168.%\'\n      AND ip NOT LIKE \'193.166.223.%\'\n    GROUP BY "downloadDate", "ip", "country", "measurementDate", "productType", "siteId"',
      ],
    );
  }
}
