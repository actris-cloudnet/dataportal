import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDoneTaskStatus1727692787845 implements MigrationInterface {
  name = "AddDoneTaskStatus1727692787845";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task" ADD "doneAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TYPE "public"."task_status_enum" RENAME TO "task_status_enum_old"`);
    await queryRunner.query(
      `CREATE TYPE "public"."task_status_enum" AS ENUM('created', 'running', 'restart', 'failed', 'done')`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "status" TYPE "public"."task_status_enum" USING "status"::"text"::"public"."task_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."task_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."task_status_enum_old" AS ENUM('created', 'running', 'restart', 'failed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "status" TYPE "public"."task_status_enum_old" USING "status"::"text"::"public"."task_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."task_status_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."task_status_enum_old" RENAME TO "task_status_enum"`);
    await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "doneAt"`);
  }
}
