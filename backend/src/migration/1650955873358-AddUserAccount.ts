import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserAccount1650955873358 implements MigrationInterface {
  name = "AddUserAccount1650955873358";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_account" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "passwordHash" character varying NOT NULL, CONSTRAINT "UQ_3c4d4fae641bf9048ad324ee0d9" UNIQUE ("username"), CONSTRAINT "PK_6acfec7285fdf9f463462de3e9f" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_account"`);
  }
}
