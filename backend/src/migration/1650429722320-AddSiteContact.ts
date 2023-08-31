import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSiteContact1650429722320 implements MigrationInterface {
  name = "AddSiteContact1650429722320";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "person" ("id" SERIAL NOT NULL, "firstname" character varying NOT NULL, "surname" character varying NOT NULL, "orcid" character varying, CONSTRAINT "UQ_ab0aec1ef042637ef489955b54d" UNIQUE ("orcid"), CONSTRAINT "PK_5fdaf670315c4b7e70cce85daa3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "site_contact" ("id" SERIAL NOT NULL, "role" character varying NOT NULL, "email" character varying NOT NULL, "siteId" character varying, "personId" integer, CONSTRAINT "PK_4d49e51b25416eb387e1fe6edff" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_contact" ADD CONSTRAINT "FK_2b7f71d52177cbca38c6212ad66" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_contact" ADD CONSTRAINT "FK_dadbd63f40e08915fb84c8843ec" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site_contact" DROP CONSTRAINT "FK_dadbd63f40e08915fb84c8843ec"`);
    await queryRunner.query(`ALTER TABLE "site_contact" DROP CONSTRAINT "FK_2b7f71d52177cbca38c6212ad66"`);
    await queryRunner.query(`DROP TABLE "site_contact"`);
    await queryRunner.query(`DROP TABLE "person"`);
  }
}
