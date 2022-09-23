import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveQualityReport1663921510168 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "quality_report"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "quality_report" ("fileUuid" uuid NOT NULL, "report" jsonb NOT NULL, CONSTRAINT "PK_0c4fc5419d1c694c2750009a7b3" PRIMARY KEY ("fileUuid"))`
    );
  }
}
