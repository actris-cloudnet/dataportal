import { MigrationInterface, QueryRunner } from "typeorm";

export class ReviseQualityControl1663154444219 implements MigrationInterface {
  name = "ReviseQualityControl1663154444219";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "file" RENAME COLUMN "qualityScore" TO "errorLevel"`);
    await queryRunner.query(`ALTER TABLE "regular_file" RENAME COLUMN "qualityScore" TO "errorLevel"`);
    await queryRunner.query(`ALTER TABLE "model_file" RENAME COLUMN "qualityScore" TO "errorLevel"`);
    await queryRunner.query(`ALTER TABLE "search_file" RENAME COLUMN "qualityScore" TO "errorLevel"`);
    await queryRunner.query(`CREATE TYPE "file_quality_errorlevel_enum" AS ENUM('pass', 'warning', 'error')`);
    await queryRunner.query(
      `CREATE TABLE "file_quality" ("uuid" uuid NOT NULL, "errorLevel" "file_quality_errorlevel_enum" NOT NULL, "qcVersion" text NOT NULL, "timestamp" TIMESTAMP NOT NULL, "tests" smallint, "errors" smallint, "warnings" smallint, CONSTRAINT "PK_bbbe61ac723ea8b8f8be5f21ad5" PRIMARY KEY ("uuid"))`
    );
    await queryRunner.query(`ALTER TABLE "quality_report" DROP CONSTRAINT "PK_0c4fc5419d1c694c2750009a7b3"`);
    await queryRunner.query(`ALTER TABLE "quality_report" DROP COLUMN "fileUuid"`);
    await queryRunner.query(`ALTER TABLE "quality_report" DROP COLUMN "report"`);
    await queryRunner.query(`ALTER TABLE "quality_report" ADD "testId" text NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "quality_report" ADD CONSTRAINT "PK_cc1aa6670d23c5af1ccc4627fb7" PRIMARY KEY ("testId")`
    );
    await queryRunner.query(`ALTER TABLE "quality_report" ADD "description" text NOT NULL`);
    await queryRunner.query(`CREATE TYPE "quality_report_result_enum" AS ENUM('pass', 'warning', 'error')`);
    await queryRunner.query(`ALTER TABLE "quality_report" ADD "result" "quality_report_result_enum" NOT NULL`);
    await queryRunner.query(`ALTER TABLE "quality_report" ADD "exceptions" jsonb`);
    await queryRunner.query(`ALTER TABLE "quality_report" ADD "qualityUuid" uuid NOT NULL`);
    await queryRunner.query(`ALTER TABLE "quality_report" DROP CONSTRAINT "PK_cc1aa6670d23c5af1ccc4627fb7"`);
    await queryRunner.query(
      `ALTER TABLE "quality_report" ADD CONSTRAINT "PK_4a803d826d2723b065a7d9e6bc1" PRIMARY KEY ("testId", "qualityUuid")`
    );
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "errorLevel"`);
    await queryRunner.query(`CREATE TYPE "file_errorlevel_enum" AS ENUM('pass', 'warning', 'error')`);
    await queryRunner.query(`ALTER TABLE "file" ADD "errorLevel" "file_errorlevel_enum"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "errorLevel"`);
    await queryRunner.query(`CREATE TYPE "regular_file_errorlevel_enum" AS ENUM('pass', 'warning', 'error')`);
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "errorLevel" "regular_file_errorlevel_enum"`);
    await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "errorLevel"`);
    await queryRunner.query(`CREATE TYPE "model_file_errorlevel_enum" AS ENUM('pass', 'warning', 'error')`);
    await queryRunner.query(`ALTER TABLE "model_file" ADD "errorLevel" "model_file_errorlevel_enum"`);
    await queryRunner.query(`ALTER TABLE "search_file" DROP COLUMN "errorLevel"`);
    await queryRunner.query(`CREATE TYPE "search_file_errorlevel_enum" AS ENUM('pass', 'warning', 'error')`);
    await queryRunner.query(`ALTER TABLE "search_file" ADD "errorLevel" "search_file_errorlevel_enum"`);
    await queryRunner.query(
      `ALTER TABLE "quality_report" ADD CONSTRAINT "FK_bfe63e2bfe92e86a2119e10bb01" FOREIGN KEY ("qualityUuid") REFERENCES "file_quality"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quality_report" DROP CONSTRAINT "FK_bfe63e2bfe92e86a2119e10bb01"`);
    await queryRunner.query(`ALTER TABLE "search_file" DROP COLUMN "errorLevel"`);
    await queryRunner.query(`DROP TYPE "search_file_errorlevel_enum"`);
    await queryRunner.query(`ALTER TABLE "search_file" ADD "errorLevel" double precision`);
    await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "errorLevel"`);
    await queryRunner.query(`DROP TYPE "model_file_errorlevel_enum"`);
    await queryRunner.query(`ALTER TABLE "model_file" ADD "errorLevel" double precision`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "errorLevel"`);
    await queryRunner.query(`DROP TYPE "regular_file_errorlevel_enum"`);
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "errorLevel" double precision`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "errorLevel"`);
    await queryRunner.query(`DROP TYPE "file_errorlevel_enum"`);
    await queryRunner.query(`ALTER TABLE "file" ADD "errorLevel" double precision`);
    await queryRunner.query(`ALTER TABLE "quality_report" DROP CONSTRAINT "PK_4a803d826d2723b065a7d9e6bc1"`);
    await queryRunner.query(
      `ALTER TABLE "quality_report" ADD CONSTRAINT "PK_cc1aa6670d23c5af1ccc4627fb7" PRIMARY KEY ("testId")`
    );
    await queryRunner.query(`ALTER TABLE "quality_report" DROP COLUMN "qualityUuid"`);
    await queryRunner.query(`ALTER TABLE "quality_report" DROP COLUMN "exceptions"`);
    await queryRunner.query(`ALTER TABLE "quality_report" DROP COLUMN "result"`);
    await queryRunner.query(`DROP TYPE "quality_report_result_enum"`);
    await queryRunner.query(`ALTER TABLE "quality_report" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "quality_report" DROP CONSTRAINT "PK_cc1aa6670d23c5af1ccc4627fb7"`);
    await queryRunner.query(`ALTER TABLE "quality_report" DROP COLUMN "testId"`);
    await queryRunner.query(`ALTER TABLE "quality_report" ADD "report" jsonb NOT NULL`);
    await queryRunner.query(`ALTER TABLE "quality_report" ADD "fileUuid" uuid NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "quality_report" ADD CONSTRAINT "PK_0c4fc5419d1c694c2750009a7b3" PRIMARY KEY ("fileUuid")`
    );
    await queryRunner.query(`DROP TABLE "file_quality"`);
    await queryRunner.query(`DROP TYPE "file_quality_errorlevel_enum"`);
    await queryRunner.query(`ALTER TABLE "search_file" RENAME COLUMN "errorLevel" TO "qualityScore"`);
    await queryRunner.query(`ALTER TABLE "model_file" RENAME COLUMN "errorLevel" TO "qualityScore"`);
    await queryRunner.query(`ALTER TABLE "regular_file" RENAME COLUMN "errorLevel" TO "qualityScore"`);
    await queryRunner.query(`ALTER TABLE "file" RENAME COLUMN "errorLevel" TO "qualityScore"`);
  }
}
