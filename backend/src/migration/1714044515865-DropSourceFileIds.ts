import { MigrationInterface, QueryRunner } from "typeorm";

export class DropSourceFileIds1714044515865 implements MigrationInterface {
  name = "DropSourceFileIds1714044515865";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "sourceFileIds"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "sourceFileIds" uuid array`);
  }
}
