import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeInstrumentInfoInstrumentIdToNotNull1755260314174 implements MigrationInterface {
  name = "ChangeInstrumentInfoInstrumentIdToNotNull1755260314174";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument_info" DROP CONSTRAINT "FK_985cb44e0355208c9badf793a38"`);
    await queryRunner.query(`ALTER TABLE "instrument_info" ALTER COLUMN "instrumentId" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "instrument_info" ADD CONSTRAINT "FK_985cb44e0355208c9badf793a38" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument_info" DROP CONSTRAINT "FK_985cb44e0355208c9badf793a38"`);
    await queryRunner.query(`ALTER TABLE "instrument_info" ALTER COLUMN "instrumentId" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "instrument_info" ADD CONSTRAINT "FK_985cb44e0355208c9badf793a38" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
