import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameChecksum1604306824932 implements MigrationInterface {
  name = "RenameChecksum1604306824932";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "upload" RENAME COLUMN "hashSum" TO "checksum"`);
    await queryRunner.query(
      `ALTER TABLE "upload" RENAME CONSTRAINT "UQ_48edc87d9256941d0176bd4e3cd" TO "UQ_3093c34a157547232c924d13cb4"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "upload" RENAME CONSTRAINT "UQ_3093c34a157547232c924d13cb4" TO "UQ_48edc87d9256941d0176bd4e3cd"`
    );
    await queryRunner.query(`ALTER TABLE "upload" RENAME COLUMN "checksum" TO "hashSum"`);
  }
}
