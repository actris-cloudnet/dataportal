import { MigrationInterface, QueryRunner } from "typeorm";

export class SiteLocationDateToDatetime1743763191299 implements MigrationInterface {
  name = "SiteLocationDateToDatetime1743763191299";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site_location" ALTER COLUMN "date" TYPE TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site_location" ALTER COLUMN "date" TYPE DATE`);
  }
}
