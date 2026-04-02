import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDownloadableToInstrument1775124011716 implements MigrationInterface {
  name = "AddDownloadableToInstrument1775124011716";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument" ADD "downloadable" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument" DROP COLUMN "downloadable"`);
  }
}
