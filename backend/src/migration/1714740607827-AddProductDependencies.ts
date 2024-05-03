import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductDependencies1714740607827 implements MigrationInterface {
  name = "AddProductDependencies1714740607827";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_source_products_product" ("productId_1" character varying NOT NULL, "productId_2" character varying NOT NULL, CONSTRAINT "PK_fb686972b713b4ec7730279dbc0" PRIMARY KEY ("productId_1", "productId_2"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_87207b3e8f8c34bf3b55a9961d" ON "product_source_products_product" ("productId_1") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_42a0d8623cb14ac8f7e7e48585" ON "product_source_products_product" ("productId_2") `,
    );
    await queryRunner.query(
      `CREATE TABLE "instrument_derived_products_product" ("instrumentId" character varying NOT NULL, "productId" character varying NOT NULL, CONSTRAINT "PK_4429863ecec2573b403ce43b793" PRIMARY KEY ("instrumentId", "productId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6a5683fb2bfe8f863c077630e1" ON "instrument_derived_products_product" ("instrumentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6ceedf8224e4c93142ac65496a" ON "instrument_derived_products_product" ("productId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "product_source_products_product" ADD CONSTRAINT "FK_87207b3e8f8c34bf3b55a9961d6" FOREIGN KEY ("productId_1") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_source_products_product" ADD CONSTRAINT "FK_42a0d8623cb14ac8f7e7e485858" FOREIGN KEY ("productId_2") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_derived_products_product" ADD CONSTRAINT "FK_6a5683fb2bfe8f863c077630e15" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_derived_products_product" ADD CONSTRAINT "FK_6ceedf8224e4c93142ac65496ab" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "instrument_derived_products_product" DROP CONSTRAINT "FK_6ceedf8224e4c93142ac65496ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_derived_products_product" DROP CONSTRAINT "FK_6a5683fb2bfe8f863c077630e15"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_source_products_product" DROP CONSTRAINT "FK_42a0d8623cb14ac8f7e7e485858"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_source_products_product" DROP CONSTRAINT "FK_87207b3e8f8c34bf3b55a9961d6"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_6ceedf8224e4c93142ac65496a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6a5683fb2bfe8f863c077630e1"`);
    await queryRunner.query(`DROP TABLE "instrument_derived_products_product"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_42a0d8623cb14ac8f7e7e48585"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_87207b3e8f8c34bf3b55a9961d"`);
    await queryRunner.query(`DROP TABLE "product_source_products_product"`);
  }
}
