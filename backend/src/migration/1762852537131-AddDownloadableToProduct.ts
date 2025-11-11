import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDownloadableToProduct1762852537131 implements MigrationInterface {
  name = "AddDownloadableToProduct1762852537131";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" ADD "downloadable" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "downloadable"`);
  }
}
