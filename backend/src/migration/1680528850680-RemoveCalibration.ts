import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveCalibration1680528850680 implements MigrationInterface {
  name = "RemoveCalibration1680528850680";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "calibration" DROP CONSTRAINT "FK_cf35aaffc79d7cecd0804bbe62e"`);
    await queryRunner.query(`ALTER TABLE "calibration" DROP CONSTRAINT "FK_e89212db2f359ab3e93d501c8e7"`);
    await queryRunner.query(`DROP TABLE "calibration"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "calibration" ("id" SERIAL NOT NULL, "measurementDate" date NOT NULL, "calibration" jsonb NOT NULL DEFAULT '[]', "instrumentId" character varying, "siteId" character varying, CONSTRAINT "UQ_e8249fb47cad2bfbbdfe460c00b" UNIQUE ("measurementDate", "siteId", "instrumentId"), CONSTRAINT "PK_f8252d02ac0708df73275ef24a2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "calibration" ADD CONSTRAINT "FK_e89212db2f359ab3e93d501c8e7" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "calibration" ADD CONSTRAINT "FK_cf35aaffc79d7cecd0804bbe62e" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
