import { MigrationInterface, QueryRunner } from "typeorm";

export class DropFileQualityColumn1697111199271 implements MigrationInterface {
  name = "DropFileQualityColumn1697111199271";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "quality"`);
    await queryRunner.query(`DROP TYPE "public"."file_quality_enum"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "quality"`);
    await queryRunner.query(`DROP TYPE "public"."regular_file_quality_enum"`);
    await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "quality"`);
    await queryRunner.query(`DROP TYPE "public"."model_file_quality_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."model_file_quality_enum" AS ENUM('nrt', 'qc')`);
    await queryRunner.query(
      `ALTER TABLE "model_file" ADD "quality" "public"."model_file_quality_enum" NOT NULL DEFAULT 'nrt'`,
    );
    await queryRunner.query(`CREATE TYPE "public"."regular_file_quality_enum" AS ENUM('nrt', 'qc')`);
    await queryRunner.query(
      `ALTER TABLE "regular_file" ADD "quality" "public"."regular_file_quality_enum" NOT NULL DEFAULT 'nrt'`,
    );
    await queryRunner.query(`CREATE TYPE "public"."file_quality_enum" AS ENUM('nrt', 'qc')`);
    await queryRunner.query(`ALTER TABLE "file" ADD "quality" "public"."file_quality_enum" NOT NULL DEFAULT 'nrt'`);
  }
}
