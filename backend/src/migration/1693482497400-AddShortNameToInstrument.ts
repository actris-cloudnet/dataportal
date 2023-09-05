import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShortNameToInstrument1693482497400 implements MigrationInterface {
  name = "AddShortNameToInstrument1693482497400";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument" ADD "shortName" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`CREATE INDEX "IDX_73c0ef719842a790c4ddfd9aad" ON "regular_file" ("instrumentId") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_73c0ef719842a790c4ddfd9aad"`);
    await queryRunner.query(`ALTER TABLE "instrument" DROP COLUMN "shortName"`);
  }
}
