import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSiteLocation1671452233087 implements MigrationInterface {
  name = "AddSiteLocation1671452233087";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "site_location" ("date" date NOT NULL, "latitude" double precision NOT NULL, "longitude" double precision NOT NULL, "siteId" character varying NOT NULL, CONSTRAINT "PK_f0d598a664f7a847e51ead08b60" PRIMARY KEY ("date", "siteId"))`
    );
    await queryRunner.query(
      `ALTER TABLE "site_location" ADD CONSTRAINT "FK_09694208e8341ecbae25417e9ca" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site_location" DROP CONSTRAINT "FK_09694208e8341ecbae25417e9ca"`);
    await queryRunner.query(`DROP TABLE "site_location"`);
  }
}
