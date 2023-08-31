import { MigrationInterface, QueryRunner } from "typeorm";

export class SeparateModelUpload1613473294285 implements MigrationInterface {
  name = "SeparateModelUpload1613473294285";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "upload" DROP CONSTRAINT "FK_80be44ce92df7874e3abb22b863"`);
    await queryRunner.query(`ALTER TABLE "upload" DROP CONSTRAINT "FK_ac54ac25d096d2c6678beee757a"`);
    await queryRunner.query(
      `CREATE TABLE "instrument_upload" ("uuid" uuid NOT NULL, "checksum" character varying(32) NOT NULL, "filename" character varying NOT NULL, "measurementDate" date NOT NULL, "size" integer NOT NULL DEFAULT 0, "status" "upload_status_enum" NOT NULL DEFAULT 'created', "allowUpdate" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "siteId" character varying, "instrumentId" character varying, CONSTRAINT "UQ_38f035ac1dd02d10da178ccd1fe" UNIQUE ("checksum"), CONSTRAINT "PK_2ad555983d0cc3bba430df8bd6a" PRIMARY KEY ("uuid"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "model_upload" ("uuid" uuid NOT NULL, "checksum" character varying(32) NOT NULL, "filename" character varying NOT NULL, "measurementDate" date NOT NULL, "size" integer NOT NULL DEFAULT 0, "status" "upload_status_enum" NOT NULL DEFAULT 'created', "allowUpdate" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "siteId" character varying, "modelId" character varying, CONSTRAINT "UQ_345eb7a81fbb7d98d3143efe209" UNIQUE ("checksum"), CONSTRAINT "PK_e4da2dab1d9cc8c9a317a81bb2f" PRIMARY KEY ("uuid"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_upload" ADD CONSTRAINT "FK_c606832f2e49a7b7170f1add6b4" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_upload" ADD CONSTRAINT "FK_0f29176199d5093677a0b5187a8" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_upload" ADD CONSTRAINT "FK_438ad5c5fc889ac6da0d7e25ab7" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_upload" ADD CONSTRAINT "FK_2bc16eac16811295bfc3b19d612" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // CUSTOM
    await queryRunner.query(
      `INSERT INTO model_upload SELECT uuid, checksum, filename, "measurementDate", size, status, "allowUpdate", "createdAt", "updatedAt", "siteId", "modelId" FROM upload WHERE "modelId" IS NOT NULL`,
    );
    await queryRunner.query(
      `INSERT INTO instrument_upload SELECT uuid, checksum, filename, "measurementDate", size, status, "allowUpdate", "createdAt", "updatedAt", "siteId", "instrumentId" FROM upload WHERE "instrumentId" IS NOT NULL`,
    );
    await queryRunner.query(`TRUNCATE TABLE upload`);
    await queryRunner.query(`ALTER TABLE "upload" DROP COLUMN "instrumentId"`);
    await queryRunner.query(`ALTER TABLE "upload" DROP COLUMN "modelId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_upload" DROP CONSTRAINT "FK_2bc16eac16811295bfc3b19d612"`);
    await queryRunner.query(`ALTER TABLE "model_upload" DROP CONSTRAINT "FK_438ad5c5fc889ac6da0d7e25ab7"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP CONSTRAINT "FK_0f29176199d5093677a0b5187a8"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP CONSTRAINT "FK_c606832f2e49a7b7170f1add6b4"`);
    await queryRunner.query(`ALTER TABLE "upload" ADD "modelId" character varying`);
    await queryRunner.query(`ALTER TABLE "upload" ADD "instrumentId" character varying`);
    await queryRunner.query(`DROP TABLE "model_upload"`);
    await queryRunner.query(`DROP TYPE "model_upload_status_enum"`);
    await queryRunner.query(`DROP TABLE "instrument_upload"`);
    await queryRunner.query(`DROP TYPE "instrument_upload_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "upload" ADD CONSTRAINT "FK_ac54ac25d096d2c6678beee757a" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "upload" ADD CONSTRAINT "FK_80be44ce92df7874e3abb22b863" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
