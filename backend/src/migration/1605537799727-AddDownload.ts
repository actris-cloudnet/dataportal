import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDownload1605537799727 implements MigrationInterface {
  name = "AddDownload1605537799727";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "download" ("id" SERIAL NOT NULL, "objectType" character varying NOT NULL, "objectUuid" uuid NOT NULL, "ip" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_84dcb3c6afdf8b2f9c0b8cd457f" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "download"`);
  }
}
