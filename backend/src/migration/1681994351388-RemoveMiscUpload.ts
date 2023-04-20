import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveMiscUpload1681994351388 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "misc_upload"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
