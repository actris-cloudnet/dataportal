import { MigrationInterface, QueryRunner } from "typeorm";

export class UserAccountPersonOneToOne1780914907579 implements MigrationInterface {
  name = "UserAccountPersonOneToOne1780914907579";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_account" DROP CONSTRAINT "FK_a38a7de4c91f447eaef1d25b553"`);
    await queryRunner.query(
      `ALTER TABLE "user_account" ADD CONSTRAINT "UQ_a38a7de4c91f447eaef1d25b553" UNIQUE ("personId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_account" ADD CONSTRAINT "FK_a38a7de4c91f447eaef1d25b553" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_account" DROP CONSTRAINT "FK_a38a7de4c91f447eaef1d25b553"`);
    await queryRunner.query(`ALTER TABLE "user_account" DROP CONSTRAINT "UQ_a38a7de4c91f447eaef1d25b553"`);
    await queryRunner.query(
      `ALTER TABLE "user_account" ADD CONSTRAINT "FK_a38a7de4c91f447eaef1d25b553" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
