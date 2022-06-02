import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTestColumnForSite1586271414780 implements MigrationInterface {
  name = "AddTestColumnForSite1586271414780";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "site" ADD "test" boolean NOT NULL DEFAULT false`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "test"`, undefined);
  }
}
