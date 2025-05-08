import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeFileS3KeyUnique1732796565757 implements MigrationInterface {
  name = "MakeFileS3KeyUnique1732796565757";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "regular_file" ADD CONSTRAINT "UQ_4ff8d5fa4adb59e4acdebfae2fa" UNIQUE ("s3key", "version")`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_file" ADD CONSTRAINT "UQ_b7415aaaa9ae376a3b62547086f" UNIQUE ("s3key", "version")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_file" DROP CONSTRAINT "UQ_b7415aaaa9ae376a3b62547086f"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP CONSTRAINT "UQ_4ff8d5fa4adb59e4acdebfae2fa"`);
  }
}
