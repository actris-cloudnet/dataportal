import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeTokenIdFromIntToBigInt1761315805523 implements MigrationInterface {
  name = "ChangeTokenIdFromIntToBigInt1761315805523";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER SEQUENCE "task_id_seq" AS BIGINT`);
    await queryRunner.query(`ALTER TABLE "task" ALTER "id" TYPE BIGINT`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER SEQUENCE "task_id_seq" AS INTEGER`);
    await queryRunner.query(`ALTER TABLE "task" ALTER "id" TYPE INTEGER`);
  }
}
