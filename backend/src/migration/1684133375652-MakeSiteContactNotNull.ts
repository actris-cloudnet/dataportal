import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeSiteContactNotNull1684133375652 implements MigrationInterface {
  name = "MakeSiteContactNotNull1684133375652";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site_contact" DROP CONSTRAINT "FK_2b7f71d52177cbca38c6212ad66"`);
    await queryRunner.query(`ALTER TABLE "site_contact" DROP CONSTRAINT "FK_dadbd63f40e08915fb84c8843ec"`);
    await queryRunner.query(`ALTER TABLE "site_contact" ALTER COLUMN "siteId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "site_contact" ALTER COLUMN "personId" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "site_contact" ADD CONSTRAINT "FK_2b7f71d52177cbca38c6212ad66" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "site_contact" ADD CONSTRAINT "FK_dadbd63f40e08915fb84c8843ec" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site_contact" DROP CONSTRAINT "FK_dadbd63f40e08915fb84c8843ec"`);
    await queryRunner.query(`ALTER TABLE "site_contact" DROP CONSTRAINT "FK_2b7f71d52177cbca38c6212ad66"`);
    await queryRunner.query(`ALTER TABLE "site_contact" ALTER COLUMN "personId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "site_contact" ALTER COLUMN "siteId" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "site_contact" ADD CONSTRAINT "FK_dadbd63f40e08915fb84c8843ec" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "site_contact" ADD CONSTRAINT "FK_2b7f71d52177cbca38c6212ad66" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
