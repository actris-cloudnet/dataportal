import { MigrationInterface, QueryRunner } from "typeorm";

export class AddModelSites1773403899405 implements MigrationInterface {
  name = "AddModelSites1773403899405";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "model_sites_site" ("modelId" character varying NOT NULL, "siteId" character varying NOT NULL, CONSTRAINT "PK_344cd76c7d1062efbce80ccf9ec" PRIMARY KEY ("modelId", "siteId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_94c58073e021365253cf080911" ON "model_sites_site" ("modelId") `);
    await queryRunner.query(`CREATE INDEX "IDX_0c4a3d69cb97bbe016e9444bb6" ON "model_sites_site" ("siteId") `);
    await queryRunner.query(
      `ALTER TABLE "model_sites_site" ADD CONSTRAINT "FK_94c58073e021365253cf080911b" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_sites_site" ADD CONSTRAINT "FK_0c4a3d69cb97bbe016e9444bb6b" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_sites_site" DROP CONSTRAINT "FK_0c4a3d69cb97bbe016e9444bb6b"`);
    await queryRunner.query(`ALTER TABLE "model_sites_site" DROP CONSTRAINT "FK_94c58073e021365253cf080911b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0c4a3d69cb97bbe016e9444bb6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_94c58073e021365253cf080911"`);
    await queryRunner.query(`DROP TABLE "model_sites_site"`);
  }
}
