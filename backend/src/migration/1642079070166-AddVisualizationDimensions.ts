import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVisualizationDimensions1642079070166 implements MigrationInterface {
  name = "AddVisualizationDimensions1642079070166";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "visualization" ADD "width" smallint`);
    await queryRunner.query(`ALTER TABLE "visualization" ADD "height" smallint`);
    await queryRunner.query(`ALTER TABLE "visualization" ADD "marginTop" smallint`);
    await queryRunner.query(`ALTER TABLE "visualization" ADD "marginRight" smallint`);
    await queryRunner.query(`ALTER TABLE "visualization" ADD "marginBottom" smallint`);
    await queryRunner.query(`ALTER TABLE "visualization" ADD "marginLeft" smallint`);
    await queryRunner.query(`ALTER TABLE "model_visualization" ADD "width" smallint`);
    await queryRunner.query(`ALTER TABLE "model_visualization" ADD "height" smallint`);
    await queryRunner.query(`ALTER TABLE "model_visualization" ADD "marginTop" smallint`);
    await queryRunner.query(`ALTER TABLE "model_visualization" ADD "marginRight" smallint`);
    await queryRunner.query(`ALTER TABLE "model_visualization" ADD "marginBottom" smallint`);
    await queryRunner.query(`ALTER TABLE "model_visualization" ADD "marginLeft" smallint`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_visualization" DROP COLUMN "marginLeft"`);
    await queryRunner.query(`ALTER TABLE "model_visualization" DROP COLUMN "marginBottom"`);
    await queryRunner.query(`ALTER TABLE "model_visualization" DROP COLUMN "marginRight"`);
    await queryRunner.query(`ALTER TABLE "model_visualization" DROP COLUMN "marginTop"`);
    await queryRunner.query(`ALTER TABLE "model_visualization" DROP COLUMN "height"`);
    await queryRunner.query(`ALTER TABLE "model_visualization" DROP COLUMN "width"`);
    await queryRunner.query(`ALTER TABLE "visualization" DROP COLUMN "marginLeft"`);
    await queryRunner.query(`ALTER TABLE "visualization" DROP COLUMN "marginBottom"`);
    await queryRunner.query(`ALTER TABLE "visualization" DROP COLUMN "marginRight"`);
    await queryRunner.query(`ALTER TABLE "visualization" DROP COLUMN "marginTop"`);
    await queryRunner.query(`ALTER TABLE "visualization" DROP COLUMN "height"`);
    await queryRunner.query(`ALTER TABLE "visualization" DROP COLUMN "width"`);
  }
}
