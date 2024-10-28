import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFilenameColumn1730123930898 implements MigrationInterface {
  name = "AddFilenameColumn1730123930898";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "filename" character varying`);
    await queryRunner.query(`ALTER TABLE "model_file" ADD "filename" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "filename"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "filename"`);
  }
}
