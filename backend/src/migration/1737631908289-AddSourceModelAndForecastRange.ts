import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSourceModelAndForecastRange1737631908289 implements MigrationInterface {
  name = "AddSourceModelAndForecastRange1737631908289";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model" ADD "forecastStart" integer`);
    await queryRunner.query(`ALTER TABLE "model" ADD "forecastEnd" integer`);
    await queryRunner.query(`ALTER TABLE "model" ADD "sourceModelId" character varying`);
    await queryRunner.query(
      `ALTER TABLE "model" ADD CONSTRAINT "FK_2630d0a8535d9a8ed48e4a9513d" FOREIGN KEY ("sourceModelId") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model" DROP CONSTRAINT "FK_2630d0a8535d9a8ed48e4a9513d"`);
    await queryRunner.query(`ALTER TABLE "model" DROP COLUMN "sourceModelId"`);
    await queryRunner.query(`ALTER TABLE "model" DROP COLUMN "forecastEnd"`);
    await queryRunner.query(`ALTER TABLE "model" DROP COLUMN "forecastStart"`);
  }
}
