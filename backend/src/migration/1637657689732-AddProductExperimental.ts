import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductExperimental1637657689732 implements MigrationInterface {
  name = "AddProductExperimental1637657689732";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" ADD "experimental" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "experimental"`);
  }
}
