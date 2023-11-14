import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeS3KeyUnique1699961549140 implements MigrationInterface {
  name = "MakeS3KeyUnique1699961549140";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "upload" ADD CONSTRAINT "UQ_412f5ecc087ef168694d7a5b7e9" UNIQUE ("s3key")`);
    await queryRunner.query(
      `ALTER TABLE "instrument_upload" ADD CONSTRAINT "UQ_03bce78a3442ed4e0cfcd6aa804" UNIQUE ("s3key")`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_upload" ADD CONSTRAINT "UQ_f1de75247fd04021fd76597e782" UNIQUE ("s3key")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_upload" DROP CONSTRAINT "UQ_f1de75247fd04021fd76597e782"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP CONSTRAINT "UQ_03bce78a3442ed4e0cfcd6aa804"`);
    await queryRunner.query(`ALTER TABLE "upload" DROP CONSTRAINT "UQ_412f5ecc087ef168694d7a5b7e9"`);
  }
}
