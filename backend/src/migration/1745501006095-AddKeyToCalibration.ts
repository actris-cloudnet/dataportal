import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKeyToCalibration1745501006095 implements MigrationInterface {
  name = "AddKeyToCalibration1745501006095";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "calibration" RENAME TO "calibration_old"`);
    await queryRunner.query(
      `CREATE TABLE "calibration" (
         "instrumentPid" character varying NOT NULL,
         "measurementDate" date NOT NULL,
         "key" character varying NOT NULL,
         "data" jsonb NOT NULL,
         "createdAt" TIMESTAMP NOT NULL,
         "updatedAt" TIMESTAMP NOT NULL,
         CONSTRAINT "PK_09970efd0803dce7ac6ccadeb9c" PRIMARY KEY ("instrumentPid", "measurementDate", "key")
       )`,
    );
    await queryRunner.query(
      `INSERT INTO "calibration" ("instrumentPid", "measurementDate", "key", "data", "createdAt", "updatedAt")
       SELECT "instrumentPid",
              "measurementDate",
              key,
              value,
              "createdAt",
              "updatedAt"
       FROM (SELECT c."instrumentPid",
                    c."measurementDate",
                    kv.key,
                    kv.value,
                    c."createdAt",
                    c."updatedAt",
                    lag(kv.value) OVER (PARTITION BY c."instrumentPid", kv.key ORDER BY c."measurementDate") AS prev_value
             FROM "calibration_old" c, jsonb_each(c.data) AS kv) sub
       WHERE value IS DISTINCT FROM prev_value`,
    );
    await queryRunner.query(`DROP TABLE "calibration_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
