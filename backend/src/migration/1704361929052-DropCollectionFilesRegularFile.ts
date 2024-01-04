import { MigrationInterface, QueryRunner } from "typeorm";

export class DropCollectionFilesRegularFile1704361929052 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO collection_regular_files_regular_file ("collectionUuid", "regularFileUuid")
       SELECT "collectionUuid", "fileUuid" AS "regularFileUuid"
       FROM collection_files_regular_file`,
    );
    await queryRunner.dropTable("collection_files_regular_file");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
