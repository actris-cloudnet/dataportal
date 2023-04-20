import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveAuxiliary1681995105289 implements MigrationInterface {
  name = "RemoveAuxiliary1681995105289";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument" DROP COLUMN "auxiliary"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument" ADD "auxiliary" boolean NOT NULL DEFAULT false`);
  }
}
