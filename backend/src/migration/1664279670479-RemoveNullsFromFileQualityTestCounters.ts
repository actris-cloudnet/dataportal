import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveNullsFromFileQualityTestCounters1664279670479 implements MigrationInterface {
  name = "RemoveNullsFromFileQualityTestCounters1664279670479";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "file_quality" ALTER COLUMN "tests" SET NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "file_quality"."tests" IS NULL`);
    await queryRunner.query(`ALTER TABLE "file_quality" ALTER COLUMN "tests" SET DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "file_quality" ALTER COLUMN "errors" SET NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "file_quality"."errors" IS NULL`);
    await queryRunner.query(`ALTER TABLE "file_quality" ALTER COLUMN "errors" SET DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "file_quality" ALTER COLUMN "warnings" SET NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "file_quality"."warnings" IS NULL`);
    await queryRunner.query(`ALTER TABLE "file_quality" ALTER COLUMN "warnings" SET DEFAULT '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "file_quality" ALTER COLUMN "warnings" DROP DEFAULT`);
    await queryRunner.query(`COMMENT ON COLUMN "file_quality"."warnings" IS NULL`);
    await queryRunner.query(`ALTER TABLE "file_quality" ALTER COLUMN "warnings" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "file_quality" ALTER COLUMN "errors" DROP DEFAULT`);
    await queryRunner.query(`COMMENT ON COLUMN "file_quality"."errors" IS NULL`);
    await queryRunner.query(`ALTER TABLE "file_quality" ALTER COLUMN "errors" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "file_quality" ALTER COLUMN "tests" DROP DEFAULT`);
    await queryRunner.query(`COMMENT ON COLUMN "file_quality"."tests" IS NULL`);
    await queryRunner.query(`ALTER TABLE "file_quality" ALTER COLUMN "tests" DROP NOT NULL`);
  }
}
