import { MigrationInterface, QueryRunner } from "typeorm";

export class SourceFileIdsTypeToUuid1691586967622 implements MigrationInterface {
  name = "SourceFileIdsTypeToUuid1691586967622";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "regular_file" ALTER COLUMN "sourceFileIds" TYPE uuid[] USING "sourceFileIds"::uuid[]`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "regular_file" ALTER COLUMN "sourceFileIds" TYPE text[] USING "sourceFileIds"::text[]`,
    );
  }
}
