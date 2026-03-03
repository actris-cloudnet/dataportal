import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstrumentInfoModelAndTypeUrl1772522309387 implements MigrationInterface {
  name = "AddInstrumentInfoModelAndTypeUrl1772522309387";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument_info" ADD "modelUrl" text`);
    await queryRunner.query(`ALTER TABLE "instrument_info" ADD "typeUrl" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument_info" DROP COLUMN "typeUrl"`);
    await queryRunner.query(`ALTER TABLE "instrument_info" DROP COLUMN "modelUrl"`);
  }
}
