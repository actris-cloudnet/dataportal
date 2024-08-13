import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNominalInstrument1723531089878 implements MigrationInterface {
  name = "AddNominalInstrument1723531089878";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "nominal_instrument" ("siteId" character varying NOT NULL, "productId" character varying NOT NULL, "measurementDate" date NOT NULL, "instrumentInfoUuid" uuid, CONSTRAINT "PK_51fed0ec343da44030e768e3b9f" PRIMARY KEY ("siteId", "productId", "measurementDate"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "nominal_instrument" ADD CONSTRAINT "FK_98d81dd8707fd8157e6a4b4d7d9" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "nominal_instrument" ADD CONSTRAINT "FK_a3beed6609d69b780fa859ccfd4" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "nominal_instrument" ADD CONSTRAINT "FK_0359cbf690e858d3176531f3f65" FOREIGN KEY ("instrumentInfoUuid") REFERENCES "instrument_info"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "nominal_instrument" DROP CONSTRAINT "FK_0359cbf690e858d3176531f3f65"`);
    await queryRunner.query(`ALTER TABLE "nominal_instrument" DROP CONSTRAINT "FK_a3beed6609d69b780fa859ccfd4"`);
    await queryRunner.query(`ALTER TABLE "nominal_instrument" DROP CONSTRAINT "FK_98d81dd8707fd8157e6a4b4d7d9"`);
    await queryRunner.query(`DROP TABLE "nominal_instrument"`);
  }
}
