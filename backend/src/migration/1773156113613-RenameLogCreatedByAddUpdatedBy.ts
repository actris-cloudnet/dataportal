import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameLogCreatedByAddUpdatedBy1773156113613 implements MigrationInterface {
  name = "RenameLogCreatedByAddUpdatedBy1773156113613";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument_log" DROP CONSTRAINT "FK_c08cfc482d4dabbd41ef74dd4e1"`);
    await queryRunner.query(`ALTER TABLE "instrument_log" RENAME COLUMN "userAccountId" TO "createdById"`);
    await queryRunner.query(`ALTER TABLE "instrument_log" ADD "updatedById" integer`);
    await queryRunner.query(
      `ALTER TABLE "instrument_log" ADD CONSTRAINT "FK_128b86971faec8d477a45097b87" FOREIGN KEY ("createdById") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_log" ADD CONSTRAINT "FK_e4d23c7018ffe8d320ccdbcd134" FOREIGN KEY ("updatedById") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument_log" DROP CONSTRAINT "FK_e4d23c7018ffe8d320ccdbcd134"`);
    await queryRunner.query(`ALTER TABLE "instrument_log" DROP CONSTRAINT "FK_128b86971faec8d477a45097b87"`);
    await queryRunner.query(`ALTER TABLE "instrument_log" DROP COLUMN "updatedById"`);
    await queryRunner.query(`ALTER TABLE "instrument_log" RENAME COLUMN "createdById" TO "userAccountId"`);
    await queryRunner.query(
      `ALTER TABLE "instrument_log" ADD CONSTRAINT "FK_c08cfc482d4dabbd41ef74dd4e1" FOREIGN KEY ("userAccountId") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
