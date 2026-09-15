import { MigrationInterface, QueryRunner } from "typeorm";

export class VisualizationSourceFileIndex1789480069268 implements MigrationInterface {
  name = "VisualizationSourceFileIndex1789480069268";
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY "IDX_a3b021457d018320765db7bc49" ON "visualization" ("sourceFileUuid") `,
    );
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY "IDX_c780b15b6f4ec803c7a044d285" ON "model_visualization" ("sourceFileUuid") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX CONCURRENTLY "public"."IDX_c780b15b6f4ec803c7a044d285"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY "public"."IDX_a3b021457d018320765db7bc49"`);
  }
}
