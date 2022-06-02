import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConstraintToCalib1636537378918 implements MigrationInterface {
  name = "AddConstraintToCalib1636537378918";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "calibration" ADD CONSTRAINT "UQ_e8249fb47cad2bfbbdfe460c00b" UNIQUE ("measurementDate", "siteId", "instrumentId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "calibration" DROP CONSTRAINT "UQ_e8249fb47cad2bfbbdfe460c00b"`);
  }
}
