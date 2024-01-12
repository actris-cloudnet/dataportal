import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTask1704962307278 implements MigrationInterface {
  name = "AddTask1704962307278";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."upload_task_status_enum" AS ENUM('created', 'running', 'restart')`);
    await queryRunner.query(
      `CREATE TABLE "upload_task" ("id" SERIAL NOT NULL, "measurementDate" date NOT NULL, "status" "public"."upload_task_status_enum" NOT NULL, "scheduledAt" TIMESTAMP NOT NULL, "instrumentPid" character varying NOT NULL, "siteId" character varying, "instrumentId" character varying, CONSTRAINT "UQ_8d6fe6e8146b9d1b365aceb2a93" UNIQUE ("instrumentId", "instrumentPid", "siteId", "measurementDate"), CONSTRAINT "PK_528e5ba953204e6a2b39c8480a9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE TYPE "public"."product_task_status_enum" AS ENUM('created', 'running', 'restart')`);
    await queryRunner.query(
      `CREATE TABLE "product_task" ("id" SERIAL NOT NULL, "measurementDate" date NOT NULL, "status" "public"."product_task_status_enum" NOT NULL, "scheduledAt" TIMESTAMP NOT NULL, "siteId" character varying, "productId" character varying, CONSTRAINT "UQ_df80e4a1f89e2994d63c4ff8374" UNIQUE ("productId", "siteId", "measurementDate"), CONSTRAINT "PK_1dcd376a8d14aed25caf157515c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "upload_task" ADD CONSTRAINT "FK_29f4f0f929ea1ad8823439ce4f3" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "upload_task" ADD CONSTRAINT "FK_20879b8bda9d5de9ec6a1e2c958" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_task" ADD CONSTRAINT "FK_9f248e0f6006cb11b2990df7e86" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_task" ADD CONSTRAINT "FK_775ca36de02deaf392e5751f262" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_task" DROP CONSTRAINT "FK_775ca36de02deaf392e5751f262"`);
    await queryRunner.query(`ALTER TABLE "product_task" DROP CONSTRAINT "FK_9f248e0f6006cb11b2990df7e86"`);
    await queryRunner.query(`ALTER TABLE "upload_task" DROP CONSTRAINT "FK_20879b8bda9d5de9ec6a1e2c958"`);
    await queryRunner.query(`ALTER TABLE "upload_task" DROP CONSTRAINT "FK_29f4f0f929ea1ad8823439ce4f3"`);
    await queryRunner.query(`DROP TABLE "product_task"`);
    await queryRunner.query(`DROP TYPE "public"."product_task_status_enum"`);
    await queryRunner.query(`DROP TABLE "upload_task"`);
    await queryRunner.query(`DROP TYPE "public"."upload_task_status_enum"`);
  }
}
