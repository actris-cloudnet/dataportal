import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFirmwareUpdateToInstrumentLogEventType1771096726401 implements MigrationInterface {
  name = "AddFirmwareUpdateToInstrumentLogEventType1771096726401";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."instrument_log_eventtype_enum" RENAME TO "instrument_log_eventtype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."instrument_log_eventtype_enum" AS ENUM('calibration', 'maintenance', 'malfunction', 'firmware-update')`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_log" ALTER COLUMN "eventType" TYPE "public"."instrument_log_eventtype_enum" USING "eventType"::"text"::"public"."instrument_log_eventtype_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."instrument_log_eventtype_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."instrument_log_eventtype_enum_old" AS ENUM('calibration', 'maintenance', 'malfunction')`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_log" ALTER COLUMN "eventType" TYPE "public"."instrument_log_eventtype_enum_old" USING "eventType"::"text"::"public"."instrument_log_eventtype_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."instrument_log_eventtype_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."instrument_log_eventtype_enum_old" RENAME TO "instrument_log_eventtype_enum"`,
    );
  }
}
