import { MigrationInterface, QueryRunner } from "typeorm";

export class DropUploadedMetadata1704365562940 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("uploaded_metadata");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
