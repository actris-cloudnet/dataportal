import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSiteDescription1717151683897 implements MigrationInterface {
  name = "AddSiteDescription1717151683897";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" ADD "description" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "description"`);
  }
}
