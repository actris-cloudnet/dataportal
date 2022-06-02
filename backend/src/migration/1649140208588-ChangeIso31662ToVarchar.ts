import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeIso31662ToVarchar1649140208588 implements MigrationInterface {
  name = "ChangeIso31662ToVarchar1649140208588";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "iso_3166_2"`);
    await queryRunner.query(`ALTER TABLE "site" ADD "iso_3166_2" character varying(6)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "iso_3166_2"`);
    await queryRunner.query(`ALTER TABLE "site" ADD "iso_3166_2" character(6)`);
  }
}
