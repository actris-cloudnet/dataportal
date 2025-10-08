import { MigrationInterface, QueryRunner } from "typeorm";

export class AddToken1759910044282 implements MigrationInterface {
  name = "AddToken1759910044282";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "token" ("selector" bytea NOT NULL, "verifierHash" bytea NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "userAccountId" integer NOT NULL, CONSTRAINT "PK_b3a0a6b5840a04bf1edaaa4e34a" PRIMARY KEY ("selector"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "token" ADD CONSTRAINT "FK_b6cc183fb8f808590c7c7f1e610" FOREIGN KEY ("userAccountId") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "token" DROP CONSTRAINT "FK_b6cc183fb8f808590c7c7f1e610"`);
    await queryRunner.query(`DROP TABLE "token"`);
  }
}
