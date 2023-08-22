import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftware1692701904067 implements MigrationInterface {
  name = "AddSoftware1692701904067";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "software" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "version" character varying NOT NULL, "humanReadableName" text, "url" text, CONSTRAINT "UQ_6ee991aa396b43267c22128ade0" UNIQUE ("code", "version"), CONSTRAINT "PK_3ceec82cc90b32643b07e8d9841" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "file_software_software" ("fileUuid" uuid NOT NULL, "softwareId" integer NOT NULL, CONSTRAINT "PK_46858ee5fd23ddd01a7370e0d4c" PRIMARY KEY ("fileUuid", "softwareId"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_d3e4502978abd25bdc51e42c60" ON "file_software_software" ("fileUuid") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_94fcf91af85f113565d9d82ef0" ON "file_software_software" ("softwareId") `
    );
    await queryRunner.query(
      `CREATE TABLE "regular_file_software_software" ("regularFileUuid" uuid NOT NULL, "softwareId" integer NOT NULL, CONSTRAINT "PK_beb1f28e62cd9e70183524086df" PRIMARY KEY ("regularFileUuid", "softwareId"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_80069d8fc68b7b591221745c1e" ON "regular_file_software_software" ("regularFileUuid") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bcbd69960eebffb7658aec8b94" ON "regular_file_software_software" ("softwareId") `
    );
    await queryRunner.query(
      `CREATE TABLE "model_file_software_software" ("modelFileUuid" uuid NOT NULL, "softwareId" integer NOT NULL, CONSTRAINT "PK_aac272d389dd8c007c948ce991a" PRIMARY KEY ("modelFileUuid", "softwareId"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_53d4543423792e10d0c9859b07" ON "model_file_software_software" ("modelFileUuid") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_64ecef712f34a271013c99768f" ON "model_file_software_software" ("softwareId") `
    );
    await queryRunner.query(
      `ALTER TABLE "file_software_software" ADD CONSTRAINT "FK_d3e4502978abd25bdc51e42c604" FOREIGN KEY ("fileUuid") REFERENCES "file"("uuid") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "file_software_software" ADD CONSTRAINT "FK_94fcf91af85f113565d9d82ef02" FOREIGN KEY ("softwareId") REFERENCES "software"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file_software_software" ADD CONSTRAINT "FK_80069d8fc68b7b591221745c1e4" FOREIGN KEY ("regularFileUuid") REFERENCES "regular_file"("uuid") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file_software_software" ADD CONSTRAINT "FK_bcbd69960eebffb7658aec8b94a" FOREIGN KEY ("softwareId") REFERENCES "software"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "model_file_software_software" ADD CONSTRAINT "FK_53d4543423792e10d0c9859b077" FOREIGN KEY ("modelFileUuid") REFERENCES "model_file"("uuid") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "model_file_software_software" ADD CONSTRAINT "FK_64ecef712f34a271013c99768f3" FOREIGN KEY ("softwareId") REFERENCES "software"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "model_file_software_software" DROP CONSTRAINT "FK_64ecef712f34a271013c99768f3"`
    );
    await queryRunner.query(
      `ALTER TABLE "model_file_software_software" DROP CONSTRAINT "FK_53d4543423792e10d0c9859b077"`
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file_software_software" DROP CONSTRAINT "FK_bcbd69960eebffb7658aec8b94a"`
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file_software_software" DROP CONSTRAINT "FK_80069d8fc68b7b591221745c1e4"`
    );
    await queryRunner.query(`ALTER TABLE "file_software_software" DROP CONSTRAINT "FK_94fcf91af85f113565d9d82ef02"`);
    await queryRunner.query(`ALTER TABLE "file_software_software" DROP CONSTRAINT "FK_d3e4502978abd25bdc51e42c604"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_64ecef712f34a271013c99768f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_53d4543423792e10d0c9859b07"`);
    await queryRunner.query(`DROP TABLE "model_file_software_software"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bcbd69960eebffb7658aec8b94"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_80069d8fc68b7b591221745c1e"`);
    await queryRunner.query(`DROP TABLE "regular_file_software_software"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_94fcf91af85f113565d9d82ef0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d3e4502978abd25bdc51e42c60"`);
    await queryRunner.query(`DROP TABLE "file_software_software"`);
    await queryRunner.query(`DROP TABLE "software"`);
  }
}
