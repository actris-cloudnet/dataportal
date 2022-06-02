import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexForFiles1599143620120 implements MigrationInterface {
  name = "AddIndexForFiles1599143620120";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_47594c1ce8314490ec0ddc7c75" ON "file" ("measurementDate", "siteId", "productId") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_47594c1ce8314490ec0ddc7c75"`);
  }
}
