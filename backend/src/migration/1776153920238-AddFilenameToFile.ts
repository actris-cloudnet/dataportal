import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFilenameToFile1776153920238 implements MigrationInterface {
  name = "AddFilenameToFile1776153920238";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE regular_file ADD filename character varying`);
    await queryRunner.query(`ALTER TABLE model_file ADD filename character varying`);
    await queryRunner.query(`UPDATE regular_file SET filename = regexp_replace(s3key, '.+/', '')`);
    await queryRunner.query(`UPDATE model_file SET filename = regexp_replace(s3key, '.+/', '')`);
    await queryRunner.query(`ALTER TABLE regular_file ALTER COLUMN filename SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE model_file ALTER COLUMN filename SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE regular_file ALTER COLUMN s3key DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE model_file ALTER COLUMN s3key DROP NOT NULL`);
    await queryRunner.query(`UPDATE regular_file SET s3key = NULL WHERE s3key = filename`);
    await queryRunner.query(`UPDATE model_file SET s3key = NULL WHERE s3key = filename`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE model_file SET s3key = filename WHERE s3key IS NULL`);
    await queryRunner.query(`UPDATE regular_file SET s3key = filename WHERE s3key IS NULL`);
    await queryRunner.query(`ALTER TABLE model_file ALTER COLUMN s3key SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE regular_file ALTER COLUMN s3key SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE model_file DROP COLUMN filename`);
    await queryRunner.query(`ALTER TABLE regular_file DROP COLUMN filename`);
  }
}
