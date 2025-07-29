import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveObsoleteColuments1753710134342 implements MigrationInterface {
  name = "RemoveObsoleteColuments1753710134342";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP CONSTRAINT "FK_0f29176199d5093677a0b5187a8"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP CONSTRAINT "UQ_abb4868d0f18e26cad6d663f113"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP COLUMN "instrumentId"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP COLUMN "instrumentPid"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP CONSTRAINT "FK_0d73e39a28b69d89fd7d1ab43e1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_49b54c339e3867525f9dd99ceb"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" ALTER COLUMN "instrumentInfoUuid" SET NOT NULL`);
    await queryRunner.query(
      `CREATE INDEX "IDX_49b54c339e3867525f9dd99ceb" ON "instrument_upload" ("instrumentInfoUuid", "siteId", "measurementDate") `,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_upload" ADD CONSTRAINT "UQ_24846c8bef08c2d6295b8a8cf32" UNIQUE ("siteId", "measurementDate", "filename", "instrumentInfoUuid", "tags")`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_upload" ADD CONSTRAINT "FK_0d73e39a28b69d89fd7d1ab43e1" FOREIGN KEY ("instrumentInfoUuid") REFERENCES "instrument_info"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP CONSTRAINT "FK_0d73e39a28b69d89fd7d1ab43e1"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP CONSTRAINT "UQ_24846c8bef08c2d6295b8a8cf32"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_49b54c339e3867525f9dd99ceb"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" ALTER COLUMN "instrumentInfoUuid" DROP NOT NULL`);
    await queryRunner.query(
      `CREATE INDEX "IDX_49b54c339e3867525f9dd99ceb" ON "instrument_upload" ("measurementDate", "siteId", "instrumentInfoUuid") `,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_upload" ADD CONSTRAINT "FK_0d73e39a28b69d89fd7d1ab43e1" FOREIGN KEY ("instrumentInfoUuid") REFERENCES "instrument_info"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "instrument_upload" ADD "instrumentPid" text NOT NULL`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" ADD "instrumentId" character varying NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "instrument_upload" ADD CONSTRAINT "UQ_abb4868d0f18e26cad6d663f113" UNIQUE ("filename", "measurementDate", "siteId", "instrumentId", "instrumentPid", "tags")`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_upload" ADD CONSTRAINT "FK_0f29176199d5093677a0b5187a8" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
