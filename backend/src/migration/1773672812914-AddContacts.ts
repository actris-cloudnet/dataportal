import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContacts1773672812914 implements MigrationInterface {
  name = "AddContacts1773672812914";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "instrument_contact" ("id" SERIAL NOT NULL, "instrumentInfoUuid" uuid NOT NULL, "personId" integer NOT NULL, "startDate" date, "endDate" date, "createdAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_c93709475313eba7130c51c4a77" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9adacf239b5db59b259afc652" ON "instrument_contact" ("instrumentInfoUuid") `,
    );
    await queryRunner.query(
      `CREATE TABLE "site_contact" ("id" SERIAL NOT NULL, "siteId" character varying NOT NULL, "personId" integer NOT NULL, "startDate" date, "endDate" date, "createdAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_4d49e51b25416eb387e1fe6edff" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_2b7f71d52177cbca38c6212ad6" ON "site_contact" ("siteId") `);
    await queryRunner.query(`ALTER TABLE "person" DROP COLUMN "firstname"`);
    await queryRunner.query(`ALTER TABLE "person" DROP COLUMN "surname"`);
    await queryRunner.query(`ALTER TABLE "person" ADD "firstName" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "person" ADD "lastName" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "user_account" ADD "person_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "instrument_contact" ADD CONSTRAINT "FK_e9adacf239b5db59b259afc652a" FOREIGN KEY ("instrumentInfoUuid") REFERENCES "instrument_info"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_contact" ADD CONSTRAINT "FK_2595ea03903c354e16e7def48d3" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_account" ADD CONSTRAINT "FK_e549e3c93b35f4bd5275767af13" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_contact" ADD CONSTRAINT "FK_2b7f71d52177cbca38c6212ad66" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_contact" ADD CONSTRAINT "FK_dadbd63f40e08915fb84c8843ec" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site_contact" DROP CONSTRAINT "FK_dadbd63f40e08915fb84c8843ec"`);
    await queryRunner.query(`ALTER TABLE "site_contact" DROP CONSTRAINT "FK_2b7f71d52177cbca38c6212ad66"`);
    await queryRunner.query(`ALTER TABLE "user_account" DROP CONSTRAINT "FK_e549e3c93b35f4bd5275767af13"`);
    await queryRunner.query(`ALTER TABLE "instrument_contact" DROP CONSTRAINT "FK_2595ea03903c354e16e7def48d3"`);
    await queryRunner.query(`ALTER TABLE "instrument_contact" DROP CONSTRAINT "FK_e9adacf239b5db59b259afc652a"`);
    await queryRunner.query(`ALTER TABLE "user_account" DROP COLUMN "person_id"`);
    await queryRunner.query(`ALTER TABLE "person" DROP COLUMN "lastName"`);
    await queryRunner.query(`ALTER TABLE "person" DROP COLUMN "firstName"`);
    await queryRunner.query(`ALTER TABLE "person" ADD "surname" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "person" ADD "firstname" character varying NOT NULL`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2b7f71d52177cbca38c6212ad6"`);
    await queryRunner.query(`DROP TABLE "site_contact"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e9adacf239b5db59b259afc652"`);
    await queryRunner.query(`DROP TABLE "instrument_contact"`);
  }
}
