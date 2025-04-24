import { MigrationInterface, QueryRunner } from "typeorm";

export class DropObsoleteColumns1745413396657 implements MigrationInterface {
  name = "DropObsoleteColumns1745413396657";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regular_file" DROP CONSTRAINT "FK_73c0ef719842a790c4ddfd9aad0"`);
    await queryRunner.query(`ALTER TABLE "search_file" DROP CONSTRAINT "FK_d1671c45b493f5c5451cc920098"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_73c0ef719842a790c4ddfd9aad"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "instrumentId"`);
    await queryRunner.query(`ALTER TABLE "search_file" DROP COLUMN "instrumentPid"`);
    await queryRunner.query(`ALTER TABLE "search_file" DROP COLUMN "instrumentId"`);
    await queryRunner.query(`CREATE INDEX "IDX_777b69c29cf38a02e2e9c95271" ON "regular_file" ("instrumentInfoUuid") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_777b69c29cf38a02e2e9c95271"`);
    await queryRunner.query(`ALTER TABLE "search_file" ADD "instrumentId" character varying`);
    await queryRunner.query(`ALTER TABLE "search_file" ADD "instrumentPid" character varying`);
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "instrumentId" character varying`);
    await queryRunner.query(`CREATE INDEX "IDX_73c0ef719842a790c4ddfd9aad" ON "regular_file" ("instrumentId") `);
    await queryRunner.query(
      `ALTER TABLE "search_file" ADD CONSTRAINT "FK_d1671c45b493f5c5451cc920098" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file" ADD CONSTRAINT "FK_73c0ef719842a790c4ddfd9aad0" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
