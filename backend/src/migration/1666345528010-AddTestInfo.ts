import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTestInfo1666345528010 implements MigrationInterface {
  name = "AddTestInfo1666345528010";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "test_info" ("testId" text NOT NULL, "name" text NOT NULL, "description" text NOT NULL, CONSTRAINT "PK_382e6fe8653ba3a6cea2de550c9" PRIMARY KEY ("testId"))`,
    );
    await queryRunner.query(`ALTER TABLE "quality_report" DROP COLUMN "description"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quality_report" ADD "description" text NOT NULL`);
    await queryRunner.query(`DROP TABLE "test_info"`);
  }
}
