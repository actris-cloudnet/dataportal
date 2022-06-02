import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuality1629811086102 implements MigrationInterface {
  name = "AddQuality1629811086102";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "file_quality_enum" AS ENUM('nrt', 'qc')`);
    await queryRunner.query(`ALTER TABLE "file" ADD "quality" "file_quality_enum" NOT NULL DEFAULT 'nrt'`);
    await queryRunner.query(`CREATE TYPE "regular_file_quality_enum" AS ENUM('nrt', 'qc')`);
    await queryRunner.query(
      `ALTER TABLE "regular_file" ADD "quality" "regular_file_quality_enum" NOT NULL DEFAULT 'nrt'`
    );
    await queryRunner.query(`CREATE TYPE "model_file_quality_enum" AS ENUM('nrt', 'qc')`);
    await queryRunner.query(`ALTER TABLE "model_file" ADD "quality" "model_file_quality_enum" NOT NULL DEFAULT 'nrt'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "quality"`);
    await queryRunner.query(`DROP TYPE "model_file_quality_enum"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "quality"`);
    await queryRunner.query(`DROP TYPE "regular_file_quality_enum"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "quality"`);
    await queryRunner.query(`DROP TYPE "file_quality_enum"`);
  }
}
