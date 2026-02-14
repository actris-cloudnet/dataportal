import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstrumentLogbook1771077847328 implements MigrationInterface {
  name = "AddInstrumentLogbook1771077847328";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."instrument_log_eventtype_enum" AS ENUM('calibration', 'maintenance', 'malfunction')`,
    );
    await queryRunner.query(
      `CREATE TABLE "instrument_log" ("id" SERIAL NOT NULL, "instrumentInfoUuid" uuid NOT NULL, "eventType" "public"."instrument_log_eventtype_enum" NOT NULL, "date" date NOT NULL, "notes" text, "createdAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_982f4f6e7db132c3e8275e6b720" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_log" ADD CONSTRAINT "FK_3a44afe80699c97f99679c5db32" FOREIGN KEY ("instrumentInfoUuid") REFERENCES "instrument_info"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument_log" DROP CONSTRAINT "FK_3a44afe80699c97f99679c5db32"`);
    await queryRunner.query(`DROP TABLE "instrument_log"`);
    await queryRunner.query(`DROP TYPE "public"."instrument_log_eventtype_enum"`);
  }
}
