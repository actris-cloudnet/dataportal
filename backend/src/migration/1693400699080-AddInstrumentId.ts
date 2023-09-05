import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstrumentId1693400699080 implements MigrationInterface {
  name = "AddInstrumentId1693400699080";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "search_file" DROP CONSTRAINT "UQ_04b805110f90917f6f029ed506a"`);
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "instrumentId" character varying`);
    await queryRunner.query(`ALTER TABLE "search_file" ADD "instrumentPid" character varying`);
    await queryRunner.query(`ALTER TABLE "search_file" ADD "instrumentId" character varying`);
    await queryRunner.query(
      `ALTER TABLE "regular_file" ADD CONSTRAINT "FK_73c0ef719842a790c4ddfd9aad0" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "search_file" ADD CONSTRAINT "FK_d1671c45b493f5c5451cc920098" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "search_file" DROP CONSTRAINT "FK_d1671c45b493f5c5451cc920098"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP CONSTRAINT "FK_73c0ef719842a790c4ddfd9aad0"`);
    await queryRunner.query(`ALTER TABLE "search_file" DROP COLUMN "instrumentId"`);
    await queryRunner.query(`ALTER TABLE "search_file" DROP COLUMN "instrumentPid"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "instrumentId"`);
    await queryRunner.query(
      `ALTER TABLE "search_file" ADD CONSTRAINT "UQ_04b805110f90917f6f029ed506a" UNIQUE ("measurementDate", "siteId", "productId")`,
    );
  }
}
