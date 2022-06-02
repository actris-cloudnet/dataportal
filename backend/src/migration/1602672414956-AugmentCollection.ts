import { MigrationInterface, QueryRunner } from "typeorm";

export class AugmentCollection1602672414956 implements MigrationInterface {
  name = "AugmentCollection1602672414956";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "collection" ADD "pid" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "collection" ADD "title" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "collection" ADD "downloadCount" integer NOT NULL DEFAULT 0`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "pid"`);
    await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "downloadCount"`);
    await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "title"`);
  }
}
