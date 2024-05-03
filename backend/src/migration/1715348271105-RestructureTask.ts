import { MigrationInterface, QueryRunner } from "typeorm";

export class RestructureTask1715348271105 implements MigrationInterface {
  name = "RestructureTask1715348271105";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."task_type_enum" AS ENUM('process', 'freeze', 'plot', 'qc', 'dvas')`);
    await queryRunner.query(
      `CREATE TYPE "public"."task_status_enum" AS ENUM('created', 'running', 'restart', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "task" ("id" SERIAL NOT NULL, "type" "public"."task_type_enum" NOT NULL, "siteId" character varying NOT NULL, "measurementDate" date NOT NULL, "status" "public"."task_status_enum" NOT NULL, "productId" character varying NOT NULL, "instrumentInfoUuid" uuid, "modelId" character varying, "scheduledAt" TIMESTAMP NOT NULL, "priority" smallint NOT NULL, CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" ADD CONSTRAINT "FK_5446de5acae04ce82a12ba307fb" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" ADD CONSTRAINT "FK_8a453a6c5f9205e83c025240136" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" ADD CONSTRAINT "FK_f62966ed4d5284af52a9a622394" FOREIGN KEY ("instrumentInfoUuid") REFERENCES "instrument_info"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" ADD CONSTRAINT "FK_42ffc4bbc383eee7ffe0003e888" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_42ffc4bbc383eee7ffe0003e888"`);
    await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_f62966ed4d5284af52a9a622394"`);
    await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_8a453a6c5f9205e83c025240136"`);
    await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_5446de5acae04ce82a12ba307fb"`);
    await queryRunner.query(`DROP TABLE "task"`);
    await queryRunner.query(`DROP TYPE "public"."task_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."task_type_enum"`);
  }
}
