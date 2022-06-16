import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveHistoryColumn1655366091188 implements MigrationInterface {
  name = "RemoveHistoryColumn1655366091188";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "history"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "history"`);
    await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "history"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_file" ADD "history" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "history" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "file" ADD "history" character varying NOT NULL DEFAULT ''`);
  }
}
