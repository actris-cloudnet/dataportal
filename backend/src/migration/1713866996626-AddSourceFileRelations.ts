import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSourceFileRelations1713866996626 implements MigrationInterface {
  name = "AddSourceFileRelations1713866996626";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "regular_file_source_regular_files_regular_file" ("regularFileUuid_1" uuid NOT NULL, "regularFileUuid_2" uuid NOT NULL, CONSTRAINT "PK_8552815c89f41eef204d45ef9fb" PRIMARY KEY ("regularFileUuid_1", "regularFileUuid_2"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b152050811811f90ac85d2369b" ON "regular_file_source_regular_files_regular_file" ("regularFileUuid_1") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_538e55278a6c54775b811f70c1" ON "regular_file_source_regular_files_regular_file" ("regularFileUuid_2") `,
    );
    await queryRunner.query(
      `CREATE TABLE "regular_file_source_model_files_model_file" ("regularFileUuid" uuid NOT NULL, "modelFileUuid" uuid NOT NULL, CONSTRAINT "PK_23985e5ca9a0d8394ec47c1e953" PRIMARY KEY ("regularFileUuid", "modelFileUuid"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_661697ba7947e4be3844654eec" ON "regular_file_source_model_files_model_file" ("regularFileUuid") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1f9e3e4c633a9eb5277c5091c9" ON "regular_file_source_model_files_model_file" ("modelFileUuid") `,
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file_source_regular_files_regular_file" ADD CONSTRAINT "FK_b152050811811f90ac85d2369b5" FOREIGN KEY ("regularFileUuid_1") REFERENCES "regular_file"("uuid") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file_source_regular_files_regular_file" ADD CONSTRAINT "FK_538e55278a6c54775b811f70c17" FOREIGN KEY ("regularFileUuid_2") REFERENCES "regular_file"("uuid") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file_source_model_files_model_file" ADD CONSTRAINT "FK_661697ba7947e4be3844654eece" FOREIGN KEY ("regularFileUuid") REFERENCES "regular_file"("uuid") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file_source_model_files_model_file" ADD CONSTRAINT "FK_1f9e3e4c633a9eb5277c5091c9f" FOREIGN KEY ("modelFileUuid") REFERENCES "model_file"("uuid") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "regular_file_source_model_files_model_file" DROP CONSTRAINT "FK_1f9e3e4c633a9eb5277c5091c9f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file_source_model_files_model_file" DROP CONSTRAINT "FK_661697ba7947e4be3844654eece"`,
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file_source_regular_files_regular_file" DROP CONSTRAINT "FK_538e55278a6c54775b811f70c17"`,
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file_source_regular_files_regular_file" DROP CONSTRAINT "FK_b152050811811f90ac85d2369b5"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_1f9e3e4c633a9eb5277c5091c9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_661697ba7947e4be3844654eec"`);
    await queryRunner.query(`DROP TABLE "regular_file_source_model_files_model_file"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_538e55278a6c54775b811f70c1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b152050811811f90ac85d2369b"`);
    await queryRunner.query(`DROP TABLE "regular_file_source_regular_files_regular_file"`);
  }
}
