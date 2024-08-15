import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHkdTaskType1723728027239 implements MigrationInterface {
  name = "AddHkdTaskType1723728027239";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."task_type_enum" RENAME TO "task_type_enum_old"`);
    await queryRunner.query(
      `CREATE TYPE "public"."task_type_enum" AS ENUM('process', 'freeze', 'plot', 'qc', 'dvas', 'hkd')`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "type" TYPE "public"."task_type_enum" USING "type"::"text"::"public"."task_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."task_type_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."task_type_enum_old" AS ENUM('process', 'freeze', 'plot', 'qc', 'dvas')`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "type" TYPE "public"."task_type_enum_old" USING "type"::"text"::"public"."task_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."task_type_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."task_type_enum_old" RENAME TO "task_type_enum"`);
  }
}
