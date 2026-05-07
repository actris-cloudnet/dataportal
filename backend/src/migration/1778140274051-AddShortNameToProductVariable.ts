import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShortNameToProductVariable1778140274051 implements MigrationInterface {
  name = "AddShortNameToProductVariable1778140274051";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_variable" ADD "shortName" character varying NOT NULL DEFAULT ''`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_variable" DROP COLUMN "shortName"`);
  }
}
