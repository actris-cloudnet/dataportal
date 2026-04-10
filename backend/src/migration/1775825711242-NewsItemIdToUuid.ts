import { MigrationInterface, QueryRunner } from "typeorm";

export class NewsItemIdToUuid1775825711242 implements MigrationInterface {
  name = "NewsItemIdToUuid1775825711242";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "news_item" RENAME COLUMN "id" TO "uuid"`);
    await queryRunner.query(
      `ALTER TABLE "news_item" RENAME CONSTRAINT "PK_8e2f3e03d39030228522f707758" TO "PK_cef590878a7b6c3ec11f86c3cd8"`,
    );
    await queryRunner.query(`ALTER SEQUENCE "news_item_id_seq" RENAME TO "news_item_uuid_seq"`);
    await queryRunner.query(`ALTER TABLE "news_item" DROP CONSTRAINT "PK_cef590878a7b6c3ec11f86c3cd8"`);
    await queryRunner.query(`ALTER TABLE "news_item" DROP COLUMN "uuid"`);
    await queryRunner.query(`ALTER TABLE "news_item" ADD "uuid" uuid NOT NULL DEFAULT uuid_generate_v4()`);
    await queryRunner.query(
      `ALTER TABLE "news_item" ADD CONSTRAINT "PK_cef590878a7b6c3ec11f86c3cd8" PRIMARY KEY ("uuid")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "news_item" DROP CONSTRAINT "PK_cef590878a7b6c3ec11f86c3cd8"`);
    await queryRunner.query(`ALTER TABLE "news_item" DROP COLUMN "uuid"`);
    await queryRunner.query(`ALTER TABLE "news_item" ADD "uuid" SERIAL NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "news_item" ADD CONSTRAINT "PK_cef590878a7b6c3ec11f86c3cd8" PRIMARY KEY ("uuid")`,
    );
    await queryRunner.query(`ALTER SEQUENCE "news_item_uuid_seq" RENAME TO "news_item_id_seq"`);
    await queryRunner.query(
      `ALTER TABLE "news_item" RENAME CONSTRAINT "PK_cef590878a7b6c3ec11f86c3cd8" TO "PK_8e2f3e03d39030228522f707758"`,
    );
    await queryRunner.query(`ALTER TABLE "news_item" RENAME COLUMN "uuid" TO "id"`);
  }
}
