import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCalibration1680529024492 implements MigrationInterface {
  name = "AddCalibration1680529024492";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "calibration" ("instrumentPid" character varying NOT NULL, "measurementDate" date NOT NULL, "data" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_9f87fbc48713f4fd19351d77c38" PRIMARY KEY ("instrumentPid", "measurementDate"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "calibration"`);
  }
}
