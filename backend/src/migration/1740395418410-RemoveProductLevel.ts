import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveProductLevel1740395418410 implements MigrationInterface {
  name = "RemoveProductLevel1740395418410";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "level"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" ADD "level" character varying NOT NULL`);
  }
}
