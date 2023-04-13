import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPersonsToCitations1681405430667 implements MigrationInterface {
  name = "AddPersonsToCitations1681405430667";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "regular_citation_persons_person" ("regularCitationId" character varying NOT NULL, "personId" integer NOT NULL, CONSTRAINT "PK_167fca6c62052bbe6b37b99ffce" PRIMARY KEY ("regularCitationId", "personId"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_555fe8d34f8c547c7e49cc7745" ON "regular_citation_persons_person" ("regularCitationId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2265d198cf1866484bff793a7d" ON "regular_citation_persons_person" ("personId") `
    );
    await queryRunner.query(
      `ALTER TABLE "regular_citation_persons_person" ADD CONSTRAINT "FK_555fe8d34f8c547c7e49cc77453" FOREIGN KEY ("regularCitationId") REFERENCES "regular_citation"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "regular_citation_persons_person" ADD CONSTRAINT "FK_2265d198cf1866484bff793a7d2" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "regular_citation_persons_person" DROP CONSTRAINT "FK_2265d198cf1866484bff793a7d2"`
    );
    await queryRunner.query(
      `ALTER TABLE "regular_citation_persons_person" DROP CONSTRAINT "FK_555fe8d34f8c547c7e49cc77453"`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_2265d198cf1866484bff793a7d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_555fe8d34f8c547c7e49cc7745"`);
    await queryRunner.query(`DROP TABLE "regular_citation_persons_person"`);
  }
}
