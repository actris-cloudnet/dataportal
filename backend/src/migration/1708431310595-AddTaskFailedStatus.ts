import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaskFailedStatus1708431310595 implements MigrationInterface {
  name = "AddTaskFailedStatus1708431310595";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."upload_task_status_enum" RENAME TO "upload_task_status_enum_old"`);
    await queryRunner.query(
      `CREATE TYPE "public"."upload_task_status_enum" AS ENUM('created', 'running', 'restart', 'failed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "upload_task" ALTER COLUMN "status" TYPE "public"."upload_task_status_enum" USING "status"::"text"::"public"."upload_task_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."upload_task_status_enum_old"`);
    await queryRunner.query(`ALTER TYPE "public"."product_task_status_enum" RENAME TO "product_task_status_enum_old"`);
    await queryRunner.query(
      `CREATE TYPE "public"."product_task_status_enum" AS ENUM('created', 'running', 'restart', 'failed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_task" ALTER COLUMN "status" TYPE "public"."product_task_status_enum" USING "status"::"text"::"public"."product_task_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."product_task_status_enum_old"`);
    await queryRunner.query(`ALTER TYPE "public"."model_task_status_enum" RENAME TO "model_task_status_enum_old"`);
    await queryRunner.query(
      `CREATE TYPE "public"."model_task_status_enum" AS ENUM('created', 'running', 'restart', 'failed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_task" ALTER COLUMN "status" TYPE "public"."model_task_status_enum" USING "status"::"text"::"public"."model_task_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."model_task_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."model_task_status_enum_old" AS ENUM('created', 'running', 'restart')`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_task" ALTER COLUMN "status" TYPE "public"."model_task_status_enum_old" USING "status"::"text"::"public"."model_task_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."model_task_status_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."model_task_status_enum_old" RENAME TO "model_task_status_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."product_task_status_enum_old" AS ENUM('created', 'running', 'restart')`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_task" ALTER COLUMN "status" TYPE "public"."product_task_status_enum_old" USING "status"::"text"::"public"."product_task_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."product_task_status_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."product_task_status_enum_old" RENAME TO "product_task_status_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."upload_task_status_enum_old" AS ENUM('created', 'running', 'restart')`,
    );
    await queryRunner.query(
      `ALTER TABLE "upload_task" ALTER COLUMN "status" TYPE "public"."upload_task_status_enum_old" USING "status"::"text"::"public"."upload_task_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."upload_task_status_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."upload_task_status_enum_old" RENAME TO "upload_task_status_enum"`);
  }
}
