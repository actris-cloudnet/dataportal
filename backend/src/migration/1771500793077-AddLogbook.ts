import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLogbook1771500793077 implements MigrationInterface {
  name = "AddLogbook1771500793077";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "instrument_log_permission" ("id" SERIAL NOT NULL, "permission" character varying NOT NULL, "instrumentInfoUuid" uuid, CONSTRAINT "UQ_67e96a594c3c91e87fe27f2656c" UNIQUE ("permission", "instrumentInfoUuid"), CONSTRAINT "PK_2ad8781434556f764d6e411188b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_instrument_log_permission_global" ON "instrument_log_permission" ("permission") WHERE "instrumentInfoUuid" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."instrument_log_eventtype_enum" AS ENUM('calibration', 'check', 'installation', 'maintenance', 'malfunction', 'note', 'removal')`,
    );
    await queryRunner.query(
      `CREATE TABLE "instrument_log" ("id" SERIAL NOT NULL, "instrumentInfoUuid" uuid NOT NULL, "eventType" "public"."instrument_log_eventtype_enum" NOT NULL, "date" TIMESTAMP NOT NULL, "detail" text, "result" text, "endDate" TIMESTAMP, "notes" text, "userAccountId" integer, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP, CONSTRAINT "PK_982f4f6e7db132c3e8275e6b720" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3a44afe80699c97f99679c5db3" ON "instrument_log" ("instrumentInfoUuid") `,
    );
    await queryRunner.query(
      `CREATE TABLE "instrument_log_image" ("id" SERIAL NOT NULL, "instrumentLogId" integer NOT NULL, "s3key" character varying NOT NULL, "filename" character varying NOT NULL, "size" bigint NOT NULL, "createdAt" TIMESTAMP NOT NULL, CONSTRAINT "UQ_5c75d6bf1c8dfd35f6372fee75a" UNIQUE ("s3key"), CONSTRAINT "PK_57895c50c78a3b2b3da317dd47d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "use_acc_ins_log_per_ins_log_per" ("userAccountId" integer NOT NULL, "instrumentLogPermissionId" integer NOT NULL, CONSTRAINT "PK_7a302ed279271be8ae7f1df92c3" PRIMARY KEY ("userAccountId", "instrumentLogPermissionId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b996d8dd90b5671f065ca540ba" ON "use_acc_ins_log_per_ins_log_per" ("userAccountId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0dbe29262dc11cbad4e7d3e048" ON "use_acc_ins_log_per_ins_log_per" ("instrumentLogPermissionId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_log_permission" ADD CONSTRAINT "FK_c3c601afe35bbb68b1d5e8e5edb" FOREIGN KEY ("instrumentInfoUuid") REFERENCES "instrument_info"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_log" ADD CONSTRAINT "FK_3a44afe80699c97f99679c5db32" FOREIGN KEY ("instrumentInfoUuid") REFERENCES "instrument_info"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_log" ADD CONSTRAINT "FK_c08cfc482d4dabbd41ef74dd4e1" FOREIGN KEY ("userAccountId") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "instrument_log_image" ADD CONSTRAINT "FK_5985eabf45fc8394feb8580869e" FOREIGN KEY ("instrumentLogId") REFERENCES "instrument_log"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "use_acc_ins_log_per_ins_log_per" ADD CONSTRAINT "FK_b996d8dd90b5671f065ca540ba2" FOREIGN KEY ("userAccountId") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "use_acc_ins_log_per_ins_log_per" ADD CONSTRAINT "FK_0dbe29262dc11cbad4e7d3e048a" FOREIGN KEY ("instrumentLogPermissionId") REFERENCES "instrument_log_permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "use_acc_ins_log_per_ins_log_per" DROP CONSTRAINT "FK_0dbe29262dc11cbad4e7d3e048a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "use_acc_ins_log_per_ins_log_per" DROP CONSTRAINT "FK_b996d8dd90b5671f065ca540ba2"`,
    );
    await queryRunner.query(`ALTER TABLE "instrument_log_image" DROP CONSTRAINT "FK_5985eabf45fc8394feb8580869e"`);
    await queryRunner.query(`ALTER TABLE "instrument_log" DROP CONSTRAINT "FK_c08cfc482d4dabbd41ef74dd4e1"`);
    await queryRunner.query(`ALTER TABLE "instrument_log" DROP CONSTRAINT "FK_3a44afe80699c97f99679c5db32"`);
    await queryRunner.query(`ALTER TABLE "instrument_log_permission" DROP CONSTRAINT "FK_c3c601afe35bbb68b1d5e8e5edb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0dbe29262dc11cbad4e7d3e048"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b996d8dd90b5671f065ca540ba"`);
    await queryRunner.query(`DROP TABLE "use_acc_ins_log_per_ins_log_per"`);
    await queryRunner.query(`DROP TABLE "instrument_log_image"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3a44afe80699c97f99679c5db3"`);
    await queryRunner.query(`DROP TABLE "instrument_log"`);
    await queryRunner.query(`DROP TYPE "public"."instrument_log_eventtype_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_instrument_log_permission_global"`);
    await queryRunner.query(`DROP TABLE "instrument_log_permission"`);
  }
}
