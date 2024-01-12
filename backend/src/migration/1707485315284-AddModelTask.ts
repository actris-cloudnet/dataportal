import { MigrationInterface, QueryRunner } from "typeorm";

export class AddModelTask1707485315284 implements MigrationInterface {
  name = "AddModelTask1707485315284";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."model_task_status_enum" AS ENUM('created', 'running', 'restart')`);
    await queryRunner.query(
      `CREATE TABLE "model_task" ("id" SERIAL NOT NULL, "measurementDate" date NOT NULL, "status" "public"."model_task_status_enum" NOT NULL, "scheduledAt" TIMESTAMP NOT NULL, "siteId" character varying, "modelId" character varying, CONSTRAINT "UQ_9f27e7d2e118cf0eed54ce2d5c6" UNIQUE ("modelId", "siteId", "measurementDate"), CONSTRAINT "PK_44b1b710bd3da8d84218d00c974" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_task" ADD CONSTRAINT "FK_bac568ab7c2341b02219354e09c" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_task" ADD CONSTRAINT "FK_9db831ddc8245188ce605be0ae1" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_task" DROP CONSTRAINT "FK_9db831ddc8245188ce605be0ae1"`);
    await queryRunner.query(`ALTER TABLE "model_task" DROP CONSTRAINT "FK_bac568ab7c2341b02219354e09c"`);
    await queryRunner.query(`DROP TABLE "model_task"`);
    await queryRunner.query(`DROP TYPE "public"."model_task_status_enum"`);
  }
}
