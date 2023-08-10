import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveCollectionDownloadCount1691587845846 implements MigrationInterface {
  name = "RemoveCollectionDownloadCount1691587845846";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "downloadCount"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "collection" ADD "downloadCount" integer NOT NULL DEFAULT '0'`);
  }
}
