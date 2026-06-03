import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPublicationDate1780407119638 implements MigrationInterface {
  name = "AddPublicationDate1780407119638";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "publication" ADD "publishedAt" date`);
    await queryRunner.query(`UPDATE "publication" SET "publishedAt" = (year::text || '-01-01')::date`);
    await queryRunner.query(`ALTER TABLE "publication" ALTER COLUMN "publishedAt" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "publication" DROP COLUMN "year"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "publication" ADD "year" integer`);
    await queryRunner.query(`UPDATE "publication" SET "year" = EXTRACT(YEAR FROM "publishedAt")`);
    await queryRunner.query(`ALTER TABLE "publication" ALTER COLUMN "year" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "publication" DROP COLUMN "publishedAt"`);
  }
}
