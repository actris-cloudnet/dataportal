import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeCalibrationInstrumentPidToUuid1745576171435 implements MigrationInterface {
  name = "ChangeCalibrationInstrumentPidToUuid1745576171435";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "calibration" ADD "instrumentInfoUuid" uuid`);
    await queryRunner.query(
      `UPDATE calibration
       SET "instrumentInfoUuid" = instrument_info.uuid
       FROM instrument_info
       WHERE calibration."instrumentPid" = "instrument_info".pid`,
    );
    await queryRunner.query(`ALTER TABLE "calibration" ALTER COLUMN "instrumentInfoUuid" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "calibration" DROP CONSTRAINT "PK_09970efd0803dce7ac6ccadeb9c"`);
    await queryRunner.query(
      `ALTER TABLE "calibration" ADD CONSTRAINT "PK_09970efd0803dce7ac6ccadeb9c" PRIMARY KEY ("instrumentInfoUuid", "measurementDate", "key")`,
    );
    await queryRunner.query(
      `ALTER TABLE "calibration" ADD CONSTRAINT "FK_1e5df78e9736939a301d6cfdaa3" FOREIGN KEY ("instrumentInfoUuid") REFERENCES "instrument_info"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "calibration" DROP COLUMN "instrumentPid"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
