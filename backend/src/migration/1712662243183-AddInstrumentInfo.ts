import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstrumentInfo1712662243183 implements MigrationInterface {
  name = "AddInstrumentInfo1712662243183";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "instrument_info" ("uuid" uuid NOT NULL, "pid" character varying NOT NULL, "name" character varying NOT NULL, "owners" text array NOT NULL, "model" character varying NOT NULL, "type" character varying NOT NULL, "serialNumber" text, "instrumentId" character varying, CONSTRAINT "UQ_bd567db2b722105c22e6b7aa01f" UNIQUE ("pid"), CONSTRAINT "PK_59d4a83171ab540153178e426af" PRIMARY KEY ("uuid"))`,
    );
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "instrumentInfoUuid" uuid`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" ADD "instrumentInfoUuid" uuid`);
    await queryRunner.query(`ALTER TABLE "search_file" ADD "instrumentInfoUuid" uuid`);
    await queryRunner.query(
      `ALTER TABLE "regular_file" ADD CONSTRAINT "FK_777b69c29cf38a02e2e9c95271d" FOREIGN KEY ("instrumentInfoUuid") REFERENCES "instrument_info"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_info" ADD CONSTRAINT "FK_985cb44e0355208c9badf793a38" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_upload" ADD CONSTRAINT "FK_0d73e39a28b69d89fd7d1ab43e1" FOREIGN KEY ("instrumentInfoUuid") REFERENCES "instrument_info"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "search_file" ADD CONSTRAINT "FK_fcd40153a8e25ae150db9ac5ae1" FOREIGN KEY ("instrumentInfoUuid") REFERENCES "instrument_info"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "search_file" DROP CONSTRAINT "FK_fcd40153a8e25ae150db9ac5ae1"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP CONSTRAINT "FK_0d73e39a28b69d89fd7d1ab43e1"`);
    await queryRunner.query(`ALTER TABLE "instrument_info" DROP CONSTRAINT "FK_985cb44e0355208c9badf793a38"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP CONSTRAINT "FK_777b69c29cf38a02e2e9c95271d"`);
    await queryRunner.query(`ALTER TABLE "search_file" DROP COLUMN "instrumentInfoUuid"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP COLUMN "instrumentInfoUuid"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "instrumentInfoUuid"`);
    await queryRunner.query(`DROP TABLE "instrument_info"`);
  }
}
