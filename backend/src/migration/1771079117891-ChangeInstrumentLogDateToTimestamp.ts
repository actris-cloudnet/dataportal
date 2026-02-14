import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeInstrumentLogDateToTimestamp1771079117891 implements MigrationInterface {
  name = "ChangeInstrumentLogDateToTimestamp1771079117891";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument_log" DROP COLUMN "date"`);
    await queryRunner.query(`ALTER TABLE "instrument_log" ADD "date" TIMESTAMP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument_log" DROP COLUMN "date"`);
    await queryRunner.query(`ALTER TABLE "instrument_log" ADD "date" date NOT NULL`);
  }
}
