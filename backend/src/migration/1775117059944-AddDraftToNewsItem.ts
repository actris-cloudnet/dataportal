import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDraftToNewsItem1775117059944 implements MigrationInterface {
  name = "AddDraftToNewsItem1775117059944";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "news_item" ADD "draft" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "news_item" DROP COLUMN "draft"`);
  }
}
