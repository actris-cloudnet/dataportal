import {MigrationInterface, QueryRunner} from "typeorm";

export class AddInfoErrorLevel1669449558170 implements MigrationInterface {
    name = 'AddInfoErrorLevel1669449558170'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_quality" ADD "info" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TYPE "public"."file_quality_errorlevel_enum" RENAME TO "file_quality_errorlevel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "file_quality_errorlevel_enum" AS ENUM('pass', 'info', 'warning', 'error')`);
        await queryRunner.query(`ALTER TABLE "file_quality" ALTER COLUMN "errorLevel" TYPE "file_quality_errorlevel_enum" USING "errorLevel"::"text"::"file_quality_errorlevel_enum"`);
        await queryRunner.query(`DROP TYPE "file_quality_errorlevel_enum_old"`);
        await queryRunner.query(`COMMENT ON COLUMN "file_quality"."errorLevel" IS NULL`);
        await queryRunner.query(`ALTER TYPE "public"."quality_report_result_enum" RENAME TO "quality_report_result_enum_old"`);
        await queryRunner.query(`CREATE TYPE "quality_report_result_enum" AS ENUM('pass', 'info', 'warning', 'error')`);
        await queryRunner.query(`ALTER TABLE "quality_report" ALTER COLUMN "result" TYPE "quality_report_result_enum" USING "result"::"text"::"quality_report_result_enum"`);
        await queryRunner.query(`DROP TYPE "quality_report_result_enum_old"`);
        await queryRunner.query(`COMMENT ON COLUMN "quality_report"."result" IS NULL`);
        await queryRunner.query(`ALTER TYPE "public"."file_errorlevel_enum" RENAME TO "file_errorlevel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "file_errorlevel_enum" AS ENUM('pass', 'info', 'warning', 'error')`);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "errorLevel" TYPE "file_errorlevel_enum" USING "errorLevel"::"text"::"file_errorlevel_enum"`);
        await queryRunner.query(`DROP TYPE "file_errorlevel_enum_old"`);
        await queryRunner.query(`COMMENT ON COLUMN "file"."errorLevel" IS NULL`);
        await queryRunner.query(`ALTER TYPE "public"."regular_file_errorlevel_enum" RENAME TO "regular_file_errorlevel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "regular_file_errorlevel_enum" AS ENUM('pass', 'info', 'warning', 'error')`);
        await queryRunner.query(`ALTER TABLE "regular_file" ALTER COLUMN "errorLevel" TYPE "regular_file_errorlevel_enum" USING "errorLevel"::"text"::"regular_file_errorlevel_enum"`);
        await queryRunner.query(`DROP TYPE "regular_file_errorlevel_enum_old"`);
        await queryRunner.query(`COMMENT ON COLUMN "regular_file"."errorLevel" IS NULL`);
        await queryRunner.query(`ALTER TYPE "public"."model_file_errorlevel_enum" RENAME TO "model_file_errorlevel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "model_file_errorlevel_enum" AS ENUM('pass', 'info', 'warning', 'error')`);
        await queryRunner.query(`ALTER TABLE "model_file" ALTER COLUMN "errorLevel" TYPE "model_file_errorlevel_enum" USING "errorLevel"::"text"::"model_file_errorlevel_enum"`);
        await queryRunner.query(`DROP TYPE "model_file_errorlevel_enum_old"`);
        await queryRunner.query(`COMMENT ON COLUMN "model_file"."errorLevel" IS NULL`);
        await queryRunner.query(`ALTER TYPE "public"."search_file_errorlevel_enum" RENAME TO "search_file_errorlevel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "search_file_errorlevel_enum" AS ENUM('pass', 'info', 'warning', 'error')`);
        await queryRunner.query(`ALTER TABLE "search_file" ALTER COLUMN "errorLevel" TYPE "search_file_errorlevel_enum" USING "errorLevel"::"text"::"search_file_errorlevel_enum"`);
        await queryRunner.query(`DROP TYPE "search_file_errorlevel_enum_old"`);
        await queryRunner.query(`COMMENT ON COLUMN "search_file"."errorLevel" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "search_file"."errorLevel" IS NULL`);
        await queryRunner.query(`CREATE TYPE "search_file_errorlevel_enum_old" AS ENUM('pass', 'warning', 'error')`);
        await queryRunner.query(`ALTER TABLE "search_file" ALTER COLUMN "errorLevel" TYPE "search_file_errorlevel_enum_old" USING "errorLevel"::"text"::"search_file_errorlevel_enum_old"`);
        await queryRunner.query(`DROP TYPE "search_file_errorlevel_enum"`);
        await queryRunner.query(`ALTER TYPE "search_file_errorlevel_enum_old" RENAME TO  "search_file_errorlevel_enum"`);
        await queryRunner.query(`COMMENT ON COLUMN "model_file"."errorLevel" IS NULL`);
        await queryRunner.query(`CREATE TYPE "model_file_errorlevel_enum_old" AS ENUM('pass', 'warning', 'error')`);
        await queryRunner.query(`ALTER TABLE "model_file" ALTER COLUMN "errorLevel" TYPE "model_file_errorlevel_enum_old" USING "errorLevel"::"text"::"model_file_errorlevel_enum_old"`);
        await queryRunner.query(`DROP TYPE "model_file_errorlevel_enum"`);
        await queryRunner.query(`ALTER TYPE "model_file_errorlevel_enum_old" RENAME TO  "model_file_errorlevel_enum"`);
        await queryRunner.query(`COMMENT ON COLUMN "regular_file"."errorLevel" IS NULL`);
        await queryRunner.query(`CREATE TYPE "regular_file_errorlevel_enum_old" AS ENUM('pass', 'warning', 'error')`);
        await queryRunner.query(`ALTER TABLE "regular_file" ALTER COLUMN "errorLevel" TYPE "regular_file_errorlevel_enum_old" USING "errorLevel"::"text"::"regular_file_errorlevel_enum_old"`);
        await queryRunner.query(`DROP TYPE "regular_file_errorlevel_enum"`);
        await queryRunner.query(`ALTER TYPE "regular_file_errorlevel_enum_old" RENAME TO  "regular_file_errorlevel_enum"`);
        await queryRunner.query(`COMMENT ON COLUMN "file"."errorLevel" IS NULL`);
        await queryRunner.query(`CREATE TYPE "file_errorlevel_enum_old" AS ENUM('pass', 'warning', 'error')`);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "errorLevel" TYPE "file_errorlevel_enum_old" USING "errorLevel"::"text"::"file_errorlevel_enum_old"`);
        await queryRunner.query(`DROP TYPE "file_errorlevel_enum"`);
        await queryRunner.query(`ALTER TYPE "file_errorlevel_enum_old" RENAME TO  "file_errorlevel_enum"`);
        await queryRunner.query(`COMMENT ON COLUMN "quality_report"."result" IS NULL`);
        await queryRunner.query(`CREATE TYPE "quality_report_result_enum_old" AS ENUM('pass', 'warning', 'error')`);
        await queryRunner.query(`ALTER TABLE "quality_report" ALTER COLUMN "result" TYPE "quality_report_result_enum_old" USING "result"::"text"::"quality_report_result_enum_old"`);
        await queryRunner.query(`DROP TYPE "quality_report_result_enum"`);
        await queryRunner.query(`ALTER TYPE "quality_report_result_enum_old" RENAME TO  "quality_report_result_enum"`);
        await queryRunner.query(`COMMENT ON COLUMN "file_quality"."errorLevel" IS NULL`);
        await queryRunner.query(`CREATE TYPE "file_quality_errorlevel_enum_old" AS ENUM('pass', 'warning', 'error')`);
        await queryRunner.query(`ALTER TABLE "file_quality" ALTER COLUMN "errorLevel" TYPE "file_quality_errorlevel_enum_old" USING "errorLevel"::"text"::"file_quality_errorlevel_enum_old"`);
        await queryRunner.query(`DROP TYPE "file_quality_errorlevel_enum"`);
        await queryRunner.query(`ALTER TYPE "file_quality_errorlevel_enum_old" RENAME TO  "file_quality_errorlevel_enum"`);
        await queryRunner.query(`ALTER TABLE "file_quality" DROP COLUMN "info"`);
    }

}
