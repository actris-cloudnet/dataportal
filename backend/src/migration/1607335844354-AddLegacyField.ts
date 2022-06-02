import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLegacyField1607335844354 implements MigrationInterface {
  name = "AddLegacyField1607335844354";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "file" ADD "legacy" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "search_file" ADD "legacy" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "legacy"`);
    await queryRunner.query(`ALTER TABLE "search_file" DROP COLUMN "legacy"`);
  }
}
