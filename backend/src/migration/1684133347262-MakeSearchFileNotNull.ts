import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeSearchFileNotNull1684133347262 implements MigrationInterface {
  name = "MakeSearchFileNotNull1684133347262";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "search_file" DROP CONSTRAINT "FK_42a81a5ce2ba2ff97bf4b9fb9f4"`);
    await queryRunner.query(`ALTER TABLE "search_file" DROP CONSTRAINT "FK_fec04c86fcd20096d881d0e172f"`);
    await queryRunner.query(`ALTER TABLE "search_file" DROP CONSTRAINT "UQ_04b805110f90917f6f029ed506a"`);
    await queryRunner.query(`ALTER TABLE "search_file" ALTER COLUMN "siteId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "search_file" ALTER COLUMN "productId" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "search_file" ADD CONSTRAINT "UQ_04b805110f90917f6f029ed506a" UNIQUE ("measurementDate", "siteId", "productId")`
    );
    await queryRunner.query(
      `ALTER TABLE "search_file" ADD CONSTRAINT "FK_42a81a5ce2ba2ff97bf4b9fb9f4" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "search_file" ADD CONSTRAINT "FK_fec04c86fcd20096d881d0e172f" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "search_file" DROP CONSTRAINT "FK_fec04c86fcd20096d881d0e172f"`);
    await queryRunner.query(`ALTER TABLE "search_file" DROP CONSTRAINT "FK_42a81a5ce2ba2ff97bf4b9fb9f4"`);
    await queryRunner.query(`ALTER TABLE "search_file" DROP CONSTRAINT "UQ_04b805110f90917f6f029ed506a"`);
    await queryRunner.query(`ALTER TABLE "search_file" ALTER COLUMN "productId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "search_file" ALTER COLUMN "siteId" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "search_file" ADD CONSTRAINT "UQ_04b805110f90917f6f029ed506a" UNIQUE ("measurementDate", "siteId", "productId")`
    );
    await queryRunner.query(
      `ALTER TABLE "search_file" ADD CONSTRAINT "FK_fec04c86fcd20096d881d0e172f" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "search_file" ADD CONSTRAINT "FK_42a81a5ce2ba2ff97bf4b9fb9f4" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
