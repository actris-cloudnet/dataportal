import { MigrationInterface, QueryRunner } from "typeorm";

export class AllowNullValues1654258642703 implements MigrationInterface {
  name = "AllowNullValues1654258642703";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" ALTER COLUMN "latitude" DROP NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "site"."latitude" IS NULL`);
    await queryRunner.query(`ALTER TABLE "site" ALTER COLUMN "longitude" DROP NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "site"."longitude" IS NULL`);
    await queryRunner.query(`ALTER TABLE "site" ALTER COLUMN "altitude" DROP NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "site"."altitude" IS NULL`);
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "gaw"`);
    await queryRunner.query(`ALTER TABLE "site" ADD "gaw" character(3)`);
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "dvasId"`);
    await queryRunner.query(`ALTER TABLE "site" ADD "dvasId" character(3)`);
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "country"`);
    await queryRunner.query(`ALTER TABLE "site" ADD "country" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "country"`);
    await queryRunner.query(`ALTER TABLE "site" ADD "country" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "dvasId"`);
    await queryRunner.query(`ALTER TABLE "site" ADD "dvasId" character varying`);
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "gaw"`);
    await queryRunner.query(`ALTER TABLE "site" ADD "gaw" character varying NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "site"."altitude" IS NULL`);
    await queryRunner.query(`ALTER TABLE "site" ALTER COLUMN "altitude" SET NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "site"."longitude" IS NULL`);
    await queryRunner.query(`ALTER TABLE "site" ALTER COLUMN "longitude" SET NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "site"."latitude" IS NULL`);
    await queryRunner.query(`ALTER TABLE "site" ALTER COLUMN "latitude" SET NOT NULL`);
  }
}
