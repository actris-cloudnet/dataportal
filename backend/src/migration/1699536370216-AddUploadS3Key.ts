import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUploadS3Key1699536370216 implements MigrationInterface {
  name = "AddUploadS3Key1699536370216";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "upload" ADD "s3key" character varying`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" ADD "s3key" character varying`);
    await queryRunner.query(`ALTER TABLE "model_upload" ADD "s3key" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_upload" DROP COLUMN "s3key"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP COLUMN "s3key"`);
    await queryRunner.query(`ALTER TABLE "upload" DROP COLUMN "s3key"`);
  }
}
