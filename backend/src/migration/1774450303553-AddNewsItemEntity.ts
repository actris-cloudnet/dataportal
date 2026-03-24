import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewsItemEntity1774450303553 implements MigrationInterface {
  name = "AddNewsItemEntity1774450303553";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "news_item" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "content" text NOT NULL, "date" date NOT NULL, "slug" character varying NOT NULL, CONSTRAINT "UQ_cc4d7e8931536d05e5f5c11c091" UNIQUE ("slug"), CONSTRAINT "PK_8e2f3e03d39030228522f707758" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "news_item"`);
  }
}
