import { MigrationInterface, QueryRunner } from "typeorm";

export class AddActrisIdToSiteTable1665042692688 implements MigrationInterface {
  name = "AddActrisIdToSiteTable1665042692688";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" ADD "actrisId" smallint`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "actrisId"`);
  }
}
