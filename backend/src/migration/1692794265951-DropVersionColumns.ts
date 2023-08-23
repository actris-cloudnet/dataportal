import { MigrationInterface, QueryRunner } from "typeorm";

export class DropVersionColumns1692794265951 implements MigrationInterface {
  name = "DropVersionColumns1692794265951";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "processingVersion"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "cloudnetpyVersion"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "processingVersion"`);
    await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "processingVersion"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_file" ADD "processingVersion" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "processingVersion" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "cloudnetpyVersion" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "file" ADD "processingVersion" character varying NOT NULL DEFAULT ''`);
  }
}
