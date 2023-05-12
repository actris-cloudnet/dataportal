import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeUploadNotNull1683892640036 implements MigrationInterface {
  name = "MakeUploadNotNull1683892640036";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "upload" DROP CONSTRAINT "FK_a74dd4855e19d42b83670f3c0c1"`);
    await queryRunner.query(`ALTER TABLE "upload" ALTER COLUMN "siteId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP CONSTRAINT "FK_c606832f2e49a7b7170f1add6b4"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP CONSTRAINT "FK_0f29176199d5093677a0b5187a8"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP CONSTRAINT "UQ_abb4868d0f18e26cad6d663f113"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" ALTER COLUMN "siteId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" ALTER COLUMN "instrumentId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "model_upload" DROP CONSTRAINT "FK_438ad5c5fc889ac6da0d7e25ab7"`);
    await queryRunner.query(`ALTER TABLE "model_upload" DROP CONSTRAINT "FK_2bc16eac16811295bfc3b19d612"`);
    await queryRunner.query(`ALTER TABLE "model_upload" DROP CONSTRAINT "UQ_77b3933c927daa8dcb6534d3ca7"`);
    await queryRunner.query(`ALTER TABLE "model_upload" ALTER COLUMN "siteId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "model_upload" ALTER COLUMN "modelId" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "instrument_upload" ADD CONSTRAINT "UQ_abb4868d0f18e26cad6d663f113" UNIQUE ("siteId", "measurementDate", "filename", "instrumentId", "instrumentPid", "tags")`
    );
    await queryRunner.query(
      `ALTER TABLE "model_upload" ADD CONSTRAINT "UQ_77b3933c927daa8dcb6534d3ca7" UNIQUE ("siteId", "measurementDate", "filename", "modelId")`
    );
    await queryRunner.query(
      `ALTER TABLE "upload" ADD CONSTRAINT "FK_a74dd4855e19d42b83670f3c0c1" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_upload" ADD CONSTRAINT "FK_c606832f2e49a7b7170f1add6b4" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_upload" ADD CONSTRAINT "FK_0f29176199d5093677a0b5187a8" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "model_upload" ADD CONSTRAINT "FK_438ad5c5fc889ac6da0d7e25ab7" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "model_upload" ADD CONSTRAINT "FK_2bc16eac16811295bfc3b19d612" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_upload" DROP CONSTRAINT "FK_2bc16eac16811295bfc3b19d612"`);
    await queryRunner.query(`ALTER TABLE "model_upload" DROP CONSTRAINT "FK_438ad5c5fc889ac6da0d7e25ab7"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP CONSTRAINT "FK_0f29176199d5093677a0b5187a8"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP CONSTRAINT "FK_c606832f2e49a7b7170f1add6b4"`);
    await queryRunner.query(`ALTER TABLE "upload" DROP CONSTRAINT "FK_a74dd4855e19d42b83670f3c0c1"`);
    await queryRunner.query(`ALTER TABLE "model_upload" DROP CONSTRAINT "UQ_77b3933c927daa8dcb6534d3ca7"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP CONSTRAINT "UQ_abb4868d0f18e26cad6d663f113"`);
    await queryRunner.query(`ALTER TABLE "model_upload" ALTER COLUMN "modelId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "model_upload" ALTER COLUMN "siteId" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "model_upload" ADD CONSTRAINT "UQ_77b3933c927daa8dcb6534d3ca7" UNIQUE ("filename", "measurementDate", "siteId", "modelId")`
    );
    await queryRunner.query(
      `ALTER TABLE "model_upload" ADD CONSTRAINT "FK_2bc16eac16811295bfc3b19d612" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "model_upload" ADD CONSTRAINT "FK_438ad5c5fc889ac6da0d7e25ab7" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(`ALTER TABLE "instrument_upload" ALTER COLUMN "instrumentId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" ALTER COLUMN "siteId" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "instrument_upload" ADD CONSTRAINT "UQ_abb4868d0f18e26cad6d663f113" UNIQUE ("filename", "measurementDate", "siteId", "instrumentId", "instrumentPid", "tags")`
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_upload" ADD CONSTRAINT "FK_0f29176199d5093677a0b5187a8" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_upload" ADD CONSTRAINT "FK_c606832f2e49a7b7170f1add6b4" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(`ALTER TABLE "upload" ALTER COLUMN "siteId" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "upload" ADD CONSTRAINT "FK_a74dd4855e19d42b83670f3c0c1" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
