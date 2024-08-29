import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveSiteContact1724935358978 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "site_contact"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
