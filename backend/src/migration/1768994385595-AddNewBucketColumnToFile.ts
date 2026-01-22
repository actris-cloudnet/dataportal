import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewBucketColumnToFile1768994385595 implements MigrationInterface {
  name = "AddNewBucketColumnToFile1768994385595";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "newBucket" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "model_file" ADD "newBucket" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "newBucket"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "newBucket"`);
  }
}
