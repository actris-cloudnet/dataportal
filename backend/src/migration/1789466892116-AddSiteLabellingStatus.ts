import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSiteLabellingStatus1789466892116 implements MigrationInterface {
  name = "AddSiteLabellingStatus1789466892116";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" ADD "labellingStatus" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "labellingStatus"`);
  }
}
