import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveUserAccountOrcidIdAndFullName1781080591832 implements MigrationInterface {
  name = "RemoveUserAccountOrcidIdAndFullName1781080591832";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_account" DROP COLUMN "fullName"`);
    await queryRunner.query(`ALTER TABLE "user_account" DROP CONSTRAINT "UQ_eb6dc869a6f743244ff5b823f9d"`);
    await queryRunner.query(`ALTER TABLE "user_account" DROP COLUMN "orcidId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_account" ADD "orcidId" character varying`);
    await queryRunner.query(
      `ALTER TABLE "user_account" ADD CONSTRAINT "UQ_eb6dc869a6f743244ff5b823f9d" UNIQUE ("orcidId")`,
    );
    await queryRunner.query(`ALTER TABLE "user_account" ADD "fullName" character varying`);
  }
}
