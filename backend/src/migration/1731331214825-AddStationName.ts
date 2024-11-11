import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStationName1731331214825 implements MigrationInterface {
  name = "AddStationName1731331214825";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" ADD "stationName" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "stationName"`);
  }
}
