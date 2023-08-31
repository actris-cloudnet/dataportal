import { MigrationInterface, QueryRunner } from "typeorm";

export class AddModelTypes1604413340576 implements MigrationInterface {
  name = "AddModelTypes1604413340576";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "model" ("id" character varying NOT NULL, "optimumOrder" integer NOT NULL, CONSTRAINT "PK_d6df271bba301d5cc79462912a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "upload" ADD "size" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "upload" ADD "appendable" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "upload" ADD "modelId" character varying`);
    await queryRunner.query(
      `ALTER TABLE "upload" ADD CONSTRAINT "FK_ac54ac25d096d2c6678beee757a" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "upload" DROP CONSTRAINT "FK_ac54ac25d096d2c6678beee757a"`);
    await queryRunner.query(`ALTER TABLE "upload" DROP COLUMN "modelId"`);
    await queryRunner.query(`ALTER TABLE "upload" DROP COLUMN "appendable"`);
    await queryRunner.query(`ALTER TABLE "upload" DROP COLUMN "size"`);
    await queryRunner.query(`DROP TABLE "model"`);
  }
}
