import { MigrationInterface, QueryRunner } from "typeorm";

export class AttachPersonsToSites1655905138169 implements MigrationInterface {
  name = "AttachPersonsToSites1655905138169";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "site_persons_person" ("siteId" character varying NOT NULL, "personId" integer NOT NULL, CONSTRAINT "PK_89e5838eea9374fc5272dbc7fad" PRIMARY KEY ("siteId", "personId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_2a5d472dd0130271bf3080b94a" ON "site_persons_person" ("siteId") `);
    await queryRunner.query(`CREATE INDEX "IDX_fab78a49e9088b0c6fcf329d12" ON "site_persons_person" ("personId") `);
    await queryRunner.query(`ALTER TABLE "site_contact" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "person" ADD "email" character varying`);
    await queryRunner.query(
      `ALTER TABLE "site_persons_person" ADD CONSTRAINT "FK_2a5d472dd0130271bf3080b94a7" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_persons_person" ADD CONSTRAINT "FK_fab78a49e9088b0c6fcf329d124" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site_persons_person" DROP CONSTRAINT "FK_fab78a49e9088b0c6fcf329d124"`);
    await queryRunner.query(`ALTER TABLE "site_persons_person" DROP CONSTRAINT "FK_2a5d472dd0130271bf3080b94a7"`);
    await queryRunner.query(`ALTER TABLE "person" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "site_contact" ADD "email" character varying NOT NULL`);
    await queryRunner.query(`DROP INDEX "IDX_fab78a49e9088b0c6fcf329d12"`);
    await queryRunner.query(`DROP INDEX "IDX_2a5d472dd0130271bf3080b94a"`);
    await queryRunner.query(`DROP TABLE "site_persons_person"`);
  }
}
