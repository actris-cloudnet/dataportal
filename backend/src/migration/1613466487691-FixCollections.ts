import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCollections1613466487691 implements MigrationInterface {
  name = "FixCollections1613466487691";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regular_file" DROP CONSTRAINT "FK_0ff04a795b8f7e24950a62e6d4d"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP CONSTRAINT "FK_eae532e4ae79b4fc1ff7d1197ad"`);
    await queryRunner.query(`DROP INDEX "IDX_47594c1ce8314490ec0ddc7c75"`);
    await queryRunner.query(
      `CREATE TABLE "file" ("uuid" uuid NOT NULL, "s3key" character varying NOT NULL, "version" character varying NOT NULL, "pid" character varying NOT NULL DEFAULT '', "volatile" boolean NOT NULL DEFAULT true, "legacy" boolean NOT NULL DEFAULT false, "measurementDate" date NOT NULL, "history" character varying NOT NULL DEFAULT '', "checksum" character varying NOT NULL, "size" integer NOT NULL, "format" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "siteId" character varying, "productId" character varying, CONSTRAINT "UQ_712b0865ff53f6a05fc1ff044fc" UNIQUE ("checksum"), CONSTRAINT "PK_d95c96c207a7395158a68ee1265" PRIMARY KEY ("uuid"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_47594c1ce8314490ec0ddc7c75" ON "file" ("measurementDate", "siteId", "productId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "collection_regular_files_regular_file" ("collectionUuid" uuid NOT NULL, "regularFileUuid" uuid NOT NULL, CONSTRAINT "PK_334ea023681a7cea6c3e933d4c1" PRIMARY KEY ("collectionUuid", "regularFileUuid"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_77d0a860dd0caff6e71db7bcf9" ON "collection_regular_files_regular_file" ("collectionUuid") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fc1db9abc3afe5807779bc5624" ON "collection_regular_files_regular_file" ("regularFileUuid") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_71f98800645065d688e3f53644" ON "regular_file" ("measurementDate", "siteId", "productId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_0ff04a795b8f7e24950a62e6d4d" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_eae532e4ae79b4fc1ff7d1197ad" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file" ADD CONSTRAINT "FK_84a7299a7f5eeac049a8c545bc0" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file" ADD CONSTRAINT "FK_fca042bc6837d6c58e47fbc7d37" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_regular_files_regular_file" ADD CONSTRAINT "FK_77d0a860dd0caff6e71db7bcf96" FOREIGN KEY ("collectionUuid") REFERENCES "collection"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_regular_files_regular_file" ADD CONSTRAINT "FK_fc1db9abc3afe5807779bc56243" FOREIGN KEY ("regularFileUuid") REFERENCES "regular_file"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collection_regular_files_regular_file" DROP CONSTRAINT "FK_fc1db9abc3afe5807779bc56243"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_regular_files_regular_file" DROP CONSTRAINT "FK_77d0a860dd0caff6e71db7bcf96"`,
    );
    await queryRunner.query(`ALTER TABLE "regular_file" DROP CONSTRAINT "FK_fca042bc6837d6c58e47fbc7d37"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP CONSTRAINT "FK_84a7299a7f5eeac049a8c545bc0"`);
    await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "FK_eae532e4ae79b4fc1ff7d1197ad"`);
    await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "FK_0ff04a795b8f7e24950a62e6d4d"`);
    await queryRunner.query(`DROP INDEX "IDX_71f98800645065d688e3f53644"`);
    await queryRunner.query(`DROP INDEX "IDX_fc1db9abc3afe5807779bc5624"`);
    await queryRunner.query(`DROP INDEX "IDX_77d0a860dd0caff6e71db7bcf9"`);
    await queryRunner.query(`DROP TABLE "collection_regular_files_regular_file"`);
    await queryRunner.query(`DROP INDEX "IDX_47594c1ce8314490ec0ddc7c75"`);
    await queryRunner.query(`DROP TABLE "file"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_47594c1ce8314490ec0ddc7c75" ON "regular_file" ("measurementDate", "siteId", "productId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file" ADD CONSTRAINT "FK_eae532e4ae79b4fc1ff7d1197ad" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file" ADD CONSTRAINT "FK_0ff04a795b8f7e24950a62e6d4d" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
