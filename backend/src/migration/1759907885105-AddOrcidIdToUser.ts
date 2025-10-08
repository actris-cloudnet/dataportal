import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrcidIdToUser1759907885105 implements MigrationInterface {
  name = "AddOrcidIdToUser1759907885105";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_account" ADD "fullName" character varying`);
    await queryRunner.query(`ALTER TABLE "user_account" ADD "orcidId" character varying`);
    await queryRunner.query(
      `ALTER TABLE "user_account" ADD CONSTRAINT "UQ_eb6dc869a6f743244ff5b823f9d" UNIQUE ("orcidId")`,
    );
    await queryRunner.query(`ALTER TABLE "user_account" ALTER COLUMN "username" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_account" ALTER COLUMN "username" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "user_account" DROP CONSTRAINT "UQ_eb6dc869a6f743244ff5b823f9d"`);
    await queryRunner.query(`ALTER TABLE "user_account" DROP COLUMN "orcidId"`);
    await queryRunner.query(`ALTER TABLE "user_account" DROP COLUMN "fullName"`);
  }
}
