import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSiteTypes1610113128860 implements MigrationInterface {
  name = "AddSiteTypes1610113128860";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "isTestSite"`);
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "isModelOnlySite"`);
    await queryRunner.query(`ALTER TABLE "site" ADD "type" text array`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "type"`);
    await queryRunner.query(`ALTER TABLE "site" ADD "isModelOnlySite" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "site" ADD "isTestSite" boolean NOT NULL DEFAULT false`);
  }
}
