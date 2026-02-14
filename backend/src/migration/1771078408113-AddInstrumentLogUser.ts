import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstrumentLogUser1771078408113 implements MigrationInterface {
  name = "AddInstrumentLogUser1771078408113";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument_log" ADD "userAccountId" integer`);
    await queryRunner.query(
      `ALTER TABLE "instrument_log" ADD CONSTRAINT "FK_c08cfc482d4dabbd41ef74dd4e1" FOREIGN KEY ("userAccountId") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument_log" DROP CONSTRAINT "FK_c08cfc482d4dabbd41ef74dd4e1"`);
    await queryRunner.query(`ALTER TABLE "instrument_log" DROP COLUMN "userAccountId"`);
  }
}
