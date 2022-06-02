import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusFieldToUploadedMetadata1597834096053 implements MigrationInterface {
  name = "AddStatusFieldToUploadedMetadata1597834096053";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "uploaded_metadata_status_enum" AS ENUM('created', 'uploaded', 'processed')`);
    await queryRunner.query(
      `ALTER TABLE "uploaded_metadata" ADD "status" "uploaded_metadata_status_enum" NOT NULL DEFAULT 'created'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "uploaded_metadata_status_enum"`);
  }
}
