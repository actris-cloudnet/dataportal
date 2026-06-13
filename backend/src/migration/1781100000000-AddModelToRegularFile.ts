import { MigrationInterface, QueryRunner } from "typeorm";

export class AddModelToRegularFile1781100000000 implements MigrationInterface {
  name = "AddModelToRegularFile1781100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "modelId" character varying`);
    await queryRunner.query(`CREATE INDEX "IDX_b9f97f10f95a8ebcd79a5f0bfc" ON "regular_file" ("modelId") `);
    await queryRunner.query(
      `ALTER TABLE "regular_file" ADD CONSTRAINT "FK_b9f97f10f95a8ebcd79a5f0bfc3" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regular_file" DROP CONSTRAINT "FK_b9f97f10f95a8ebcd79a5f0bfc3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b9f97f10f95a8ebcd79a5f0bfc"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "modelId"`);
  }
}
