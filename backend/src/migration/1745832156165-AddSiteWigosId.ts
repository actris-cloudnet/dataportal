import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSiteWigosId1745832156165 implements MigrationInterface {
  name = "AddSiteWigosId1745832156165";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" ADD "wigosId" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "wigosId"`);
  }
}
