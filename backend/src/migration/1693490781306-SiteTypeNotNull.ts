import { MigrationInterface, QueryRunner } from "typeorm";

export class SiteTypeNotNull1693490781306 implements MigrationInterface {
  name = "SiteTypeNotNull1693490781306";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" ALTER COLUMN "type" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" ALTER COLUMN "type" DROP NOT NULL`);
  }
}
