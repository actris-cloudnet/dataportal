import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSiteIcosIdAndName1790593840839 implements MigrationInterface {
  name = "AddSiteIcosIdAndName1790593840839";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" ADD "icosId" text`);
    await queryRunner.query(`ALTER TABLE "site" ADD "icosName" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "icosName"`);
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "icosId"`);
  }
}
