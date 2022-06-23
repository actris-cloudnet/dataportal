import { MigrationInterface, QueryRunner } from "typeorm";

export class UserActivationToken1655978810971 implements MigrationInterface {
  name = "UserActivationToken1655978810971";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_account" ADD "activationToken" character varying`);
    await queryRunner.query(
      `ALTER TABLE "user_account" ADD CONSTRAINT "UQ_3286f7e49bdd7c80351a307c4a8" UNIQUE ("activationToken")`
    );
    await queryRunner.query(`ALTER TABLE "user_account" ALTER COLUMN "passwordHash" DROP NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "user_account"."passwordHash" IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`COMMENT ON COLUMN "user_account"."passwordHash" IS NULL`);
    await queryRunner.query(`ALTER TABLE "user_account" ALTER COLUMN "passwordHash" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "user_account" DROP CONSTRAINT "UQ_3286f7e49bdd7c80351a307c4a8"`);
    await queryRunner.query(`ALTER TABLE "user_account" DROP COLUMN "activationToken"`);
  }
}
