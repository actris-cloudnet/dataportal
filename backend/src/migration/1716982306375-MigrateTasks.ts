import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateTasks1716982306375 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO task ("id", "type", "siteId", "measurementDate", "status", "productId", "modelId", "scheduledAt", "priority")
      SELECT "id", 'process', "siteId", "measurementDate", "status"::text::task_status_enum, 'model', "modelId", "scheduledAt", 0
      FROM model_task
    `);
    await queryRunner.query(`SELECT setval('task_id_seq', (SELECT MAX(id) FROM task))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
