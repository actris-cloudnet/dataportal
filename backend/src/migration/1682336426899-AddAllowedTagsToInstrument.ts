import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAllowedTagsToInstrument1682336426899 implements MigrationInterface {
  name = "AddAllowedTagsToInstrument1682336426899";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument" ADD "allowedTags" text array NOT NULL DEFAULT '{}'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument" DROP COLUMN "allowedTags"`);
  }
}
