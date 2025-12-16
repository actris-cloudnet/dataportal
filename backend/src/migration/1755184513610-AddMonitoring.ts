import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMonitoring1755184513610 implements MigrationInterface {
  name = "AddMonitoring1755184513610";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."monitoring_file_periodtype_enum" AS ENUM('all', 'year', 'month', 'week', 'day')`,
    );
    await queryRunner.query(
      `CREATE TABLE "monitoring_file" ("uuid" uuid NOT NULL, "startDate" date, "periodType" "public"."monitoring_file_periodtype_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "siteId" character varying NOT NULL, "monitoringProductId" character varying NOT NULL, "instrumentInfoUuid" uuid NOT NULL, CONSTRAINT "UQ_ab6ee42578592dd25f9c1e93c3f" UNIQUE ("startDate", "periodType", "siteId", "monitoringProductId", "instrumentInfoUuid"), CONSTRAINT "CHK_06158137a1c07e40f676cfb297" CHECK (("periodType" = 'all' AND "startDate" IS NULL) OR ("periodType" != 'all' AND "startDate" IS NOT NULL)), CONSTRAINT "PK_a1986021aaa7458dd07a1e60388" PRIMARY KEY ("uuid"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "monitoring_visualization" ("s3key" character varying NOT NULL, "width" smallint, "height" smallint, "marginTop" smallint, "marginRight" smallint, "marginBottom" smallint, "marginLeft" smallint, "sourceFileUuid" uuid NOT NULL, "monitoringProductVariableId" character varying NOT NULL, CONSTRAINT "PK_147cc187b8d663649c5ad816928" PRIMARY KEY ("s3key"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "monitoring_product_variable" ("id" character varying NOT NULL, "humanReadableName" character varying NOT NULL, "order" smallint NOT NULL, "monitoringProductId" character varying NOT NULL, CONSTRAINT "PK_fc90be54901ad74dd366e9fd2c6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "monitoring_product" ("id" character varying NOT NULL, "humanReadableName" character varying NOT NULL, CONSTRAINT "PK_71b31885a83ae3b655720731995" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "instrument_derived_monitoring_products_monitoring_product" ("instrumentId" character varying NOT NULL, "monitoringProductId" character varying NOT NULL, CONSTRAINT "PK_9ef738b22f42557f622709f7cce" PRIMARY KEY ("instrumentId", "monitoringProductId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c52fd36031e40cbc415c3e4dfe" ON "instrument_derived_monitoring_products_monitoring_product" ("instrumentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f30bc7fc3e1c6bc9b608338e5a" ON "instrument_derived_monitoring_products_monitoring_product" ("monitoringProductId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "monitoring_file" ADD CONSTRAINT "FK_2ba3a42aed9fffa0cdc7ba98c29" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "monitoring_file" ADD CONSTRAINT "FK_c7935b1ef38197e8befda2a7293" FOREIGN KEY ("monitoringProductId") REFERENCES "monitoring_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "monitoring_file" ADD CONSTRAINT "FK_25a25dfc95a5abe15ed42f1b001" FOREIGN KEY ("instrumentInfoUuid") REFERENCES "instrument_info"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "monitoring_visualization" ADD CONSTRAINT "FK_9aaefbae94b2a460e119540a453" FOREIGN KEY ("sourceFileUuid") REFERENCES "monitoring_file"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "monitoring_visualization" ADD CONSTRAINT "FK_92e29a5d29883e3f93a2d7a9683" FOREIGN KEY ("monitoringProductVariableId") REFERENCES "monitoring_product_variable"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "monitoring_product_variable" ADD CONSTRAINT "FK_4ef6bcb326316ff563c7df4f1c7" FOREIGN KEY ("monitoringProductId") REFERENCES "monitoring_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_derived_monitoring_products_monitoring_product" ADD CONSTRAINT "FK_c52fd36031e40cbc415c3e4dfe9" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_derived_monitoring_products_monitoring_product" ADD CONSTRAINT "FK_f30bc7fc3e1c6bc9b608338e5a0" FOREIGN KEY ("monitoringProductId") REFERENCES "monitoring_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "instrument_derived_monitoring_products_monitoring_product" DROP CONSTRAINT "FK_f30bc7fc3e1c6bc9b608338e5a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_derived_monitoring_products_monitoring_product" DROP CONSTRAINT "FK_c52fd36031e40cbc415c3e4dfe9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "monitoring_product_variable" DROP CONSTRAINT "FK_4ef6bcb326316ff563c7df4f1c7"`,
    );
    await queryRunner.query(`ALTER TABLE "monitoring_visualization" DROP CONSTRAINT "FK_92e29a5d29883e3f93a2d7a9683"`);
    await queryRunner.query(`ALTER TABLE "monitoring_visualization" DROP CONSTRAINT "FK_9aaefbae94b2a460e119540a453"`);
    await queryRunner.query(`ALTER TABLE "monitoring_file" DROP CONSTRAINT "FK_25a25dfc95a5abe15ed42f1b001"`);
    await queryRunner.query(`ALTER TABLE "monitoring_file" DROP CONSTRAINT "FK_c7935b1ef38197e8befda2a7293"`);
    await queryRunner.query(`ALTER TABLE "monitoring_file" DROP CONSTRAINT "FK_2ba3a42aed9fffa0cdc7ba98c29"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f30bc7fc3e1c6bc9b608338e5a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c52fd36031e40cbc415c3e4dfe"`);
    await queryRunner.query(`DROP TABLE "instrument_derived_monitoring_products_monitoring_product"`);
    await queryRunner.query(`DROP TABLE "monitoring_product"`);
    await queryRunner.query(`DROP TABLE "monitoring_product_variable"`);
    await queryRunner.query(`DROP TABLE "monitoring_visualization"`);
    await queryRunner.query(`DROP TABLE "monitoring_file"`);
    await queryRunner.query(`DROP TYPE "public"."monitoring_file_periodtype_enum"`);
  }
}
