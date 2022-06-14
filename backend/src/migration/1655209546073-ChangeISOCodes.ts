import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeISOCodes1655209546073 implements MigrationInterface {
  name = "ChangeISOCodes1655209546073";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "iso_3166_1_alpha_2"`);
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "iso_3166_2"`);
    await queryRunner.query(`ALTER TABLE "site" ADD "countryCode" character(2)`);
    await queryRunner.query(`ALTER TABLE "site" ADD "countrySubdivisionCode" character varying(6)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "countrySubdivisionCode"`);
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "countryCode"`);
    await queryRunner.query(`ALTER TABLE "site" ADD "iso_3166_2" character varying(6)`);
    await queryRunner.query(`ALTER TABLE "site" ADD "iso_3166_1_alpha_2" character(2)`);
  }
}
