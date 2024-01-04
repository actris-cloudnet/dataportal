import { MigrationInterface, QueryRunner } from "typeorm";

export class DropFileAndUpload1704359845334 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("file_software_software");
    await queryRunner.dropTable("file");
    await queryRunner.dropTable("upload");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
