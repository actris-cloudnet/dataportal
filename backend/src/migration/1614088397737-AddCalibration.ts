import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCalibration1614088397737 implements MigrationInterface {
  name = "AddCalibration1614088397737";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "calibration" ("id" SERIAL NOT NULL, "measurementDate" date NOT NULL, "calibration" jsonb NOT NULL DEFAULT '[]', "instrumentId" character varying, "siteId" character varying, CONSTRAINT "PK_f8252d02ac0708df73275ef24a2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "calibration" ADD CONSTRAINT "FK_e89212db2f359ab3e93d501c8e7" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "calibration" ADD CONSTRAINT "FK_cf35aaffc79d7cecd0804bbe62e" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "calibration" DROP CONSTRAINT "FK_cf35aaffc79d7cecd0804bbe62e"`);
    await queryRunner.query(`ALTER TABLE "calibration" DROP CONSTRAINT "FK_e89212db2f359ab3e93d501c8e7"`);
    await queryRunner.query(`DROP TABLE "calibration"`);
  }
}
