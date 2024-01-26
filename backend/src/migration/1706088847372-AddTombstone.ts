import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTombstone1706088847372 implements MigrationInterface {
  name = "AddTombstone1706088847372";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "tombstoneReason" character varying`);
    await queryRunner.query(`ALTER TABLE "model_file" ADD "tombstoneReason" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "tombstoneReason"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "tombstoneReason"`);
  }
}
