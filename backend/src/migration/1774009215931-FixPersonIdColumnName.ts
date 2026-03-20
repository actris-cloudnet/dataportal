import { MigrationInterface, QueryRunner } from "typeorm";

export class FixPersonIdColumnName1774009215931 implements MigrationInterface {
  name = "FixPersonIdColumnName1774009215931";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_account" DROP CONSTRAINT "FK_e549e3c93b35f4bd5275767af13"`);
    await queryRunner.query(`ALTER TABLE "user_account" RENAME COLUMN "person_id" TO "personId"`);
    await queryRunner.query(
      `ALTER TABLE "user_account" ADD CONSTRAINT "FK_a38a7de4c91f447eaef1d25b553" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_account" DROP CONSTRAINT "FK_a38a7de4c91f447eaef1d25b553"`);
    await queryRunner.query(`ALTER TABLE "user_account" RENAME COLUMN "personId" TO "person_id"`);
    await queryRunner.query(
      `ALTER TABLE "user_account" ADD CONSTRAINT "FK_e549e3c93b35f4bd5275767af13" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
