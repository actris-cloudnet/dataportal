import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFilenameColumn1730123930898 implements MigrationInterface {
  name = "AddFilenameColumn1730123930898";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "filename" character varying`);
    await queryRunner.query(`UPDATE "regular_file" SET "filename" = regexp_replace(s3key, '.+/', '')`);
    await queryRunner.query(`ALTER TABLE "regular_file" ALTER COLUMN "filename" SET NOT NULL;`);
    await queryRunner.query(`ALTER TABLE "model_file" ADD "filename" character varying`);
    await queryRunner.query(`UPDATE "model_file" SET "filename" = regexp_replace(s3key, '.+/', '')`);
    await queryRunner.query(`ALTER TABLE "model_file" ALTER COLUMN "filename" SET NOT NULL;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "filename"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "filename"`);
  }
}
