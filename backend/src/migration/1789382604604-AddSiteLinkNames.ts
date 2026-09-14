import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSiteLinkNames1789382604604 implements MigrationInterface {
  name = "AddSiteLinkNames1789382604604";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" ADD "wigosName" text`);
    await queryRunner.query(`ALTER TABLE "site" ADD "dvasName" text`);
    await queryRunner.query(`ALTER TABLE "site" ADD "actrisName" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "actrisName"`);
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "dvasName"`);
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "wigosName"`);
  }
}
