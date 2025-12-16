import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeMonitoringVisDimNonNullable1765884671894 implements MigrationInterface {
  name = "ChangeMonitoringVisDimNonNullable1765884671894";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "monitoring_visualization" ALTER COLUMN "width" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "monitoring_visualization" ALTER COLUMN "height" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "monitoring_visualization" ALTER COLUMN "marginTop" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "monitoring_visualization" ALTER COLUMN "marginRight" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "monitoring_visualization" ALTER COLUMN "marginBottom" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "monitoring_visualization" ALTER COLUMN "marginLeft" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "monitoring_visualization" ALTER COLUMN "marginLeft" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "monitoring_visualization" ALTER COLUMN "marginBottom" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "monitoring_visualization" ALTER COLUMN "marginRight" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "monitoring_visualization" ALTER COLUMN "marginTop" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "monitoring_visualization" ALTER COLUMN "height" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "monitoring_visualization" ALTER COLUMN "width" DROP NOT NULL`);
  }
}
