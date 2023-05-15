import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeFileNotNull1684133145517 implements MigrationInterface {
  name = "MakeFileNotNull1684133145517";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "FK_0ff04a795b8f7e24950a62e6d4d"`);
    await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "FK_eae532e4ae79b4fc1ff7d1197ad"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_47594c1ce8314490ec0ddc7c75"`);
    await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "siteId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "productId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP CONSTRAINT "FK_84a7299a7f5eeac049a8c545bc0"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP CONSTRAINT "FK_fca042bc6837d6c58e47fbc7d37"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_71f98800645065d688e3f53644"`);
    await queryRunner.query(`ALTER TABLE "regular_file" ALTER COLUMN "siteId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "regular_file" ALTER COLUMN "productId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "model_file" DROP CONSTRAINT "FK_2ebbfc653ad9fb831f332323b68"`);
    await queryRunner.query(`ALTER TABLE "model_file" DROP CONSTRAINT "FK_dad01bc5cad3dd285d4aeafd429"`);
    await queryRunner.query(`ALTER TABLE "model_file" DROP CONSTRAINT "FK_5fe23aaa448c10790957bf74d1d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_18bd7d150abecbaa15dad8290c"`);
    await queryRunner.query(`ALTER TABLE "model_file" ALTER COLUMN "siteId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "model_file" ALTER COLUMN "productId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "model_file" ALTER COLUMN "modelId" SET NOT NULL`);
    await queryRunner.query(
      `CREATE INDEX "IDX_47594c1ce8314490ec0ddc7c75" ON "file" ("measurementDate", "siteId", "productId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_71f98800645065d688e3f53644" ON "regular_file" ("measurementDate", "siteId", "productId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_18bd7d150abecbaa15dad8290c" ON "model_file" ("measurementDate", "siteId", "productId") `
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_0ff04a795b8f7e24950a62e6d4d" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_eae532e4ae79b4fc1ff7d1197ad" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file" ADD CONSTRAINT "FK_84a7299a7f5eeac049a8c545bc0" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file" ADD CONSTRAINT "FK_fca042bc6837d6c58e47fbc7d37" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "model_file" ADD CONSTRAINT "FK_2ebbfc653ad9fb831f332323b68" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "model_file" ADD CONSTRAINT "FK_dad01bc5cad3dd285d4aeafd429" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "model_file" ADD CONSTRAINT "FK_5fe23aaa448c10790957bf74d1d" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_file" DROP CONSTRAINT "FK_5fe23aaa448c10790957bf74d1d"`);
    await queryRunner.query(`ALTER TABLE "model_file" DROP CONSTRAINT "FK_dad01bc5cad3dd285d4aeafd429"`);
    await queryRunner.query(`ALTER TABLE "model_file" DROP CONSTRAINT "FK_2ebbfc653ad9fb831f332323b68"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP CONSTRAINT "FK_fca042bc6837d6c58e47fbc7d37"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP CONSTRAINT "FK_84a7299a7f5eeac049a8c545bc0"`);
    await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "FK_eae532e4ae79b4fc1ff7d1197ad"`);
    await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "FK_0ff04a795b8f7e24950a62e6d4d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_18bd7d150abecbaa15dad8290c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_71f98800645065d688e3f53644"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_47594c1ce8314490ec0ddc7c75"`);
    await queryRunner.query(`ALTER TABLE "model_file" ALTER COLUMN "modelId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "model_file" ALTER COLUMN "productId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "model_file" ALTER COLUMN "siteId" DROP NOT NULL`);
    await queryRunner.query(
      `CREATE INDEX "IDX_18bd7d150abecbaa15dad8290c" ON "model_file" ("measurementDate", "siteId", "productId") `
    );
    await queryRunner.query(
      `ALTER TABLE "model_file" ADD CONSTRAINT "FK_5fe23aaa448c10790957bf74d1d" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "model_file" ADD CONSTRAINT "FK_dad01bc5cad3dd285d4aeafd429" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "model_file" ADD CONSTRAINT "FK_2ebbfc653ad9fb831f332323b68" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(`ALTER TABLE "regular_file" ALTER COLUMN "productId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "regular_file" ALTER COLUMN "siteId" DROP NOT NULL`);
    await queryRunner.query(
      `CREATE INDEX "IDX_71f98800645065d688e3f53644" ON "regular_file" ("measurementDate", "siteId", "productId") `
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file" ADD CONSTRAINT "FK_fca042bc6837d6c58e47fbc7d37" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "regular_file" ADD CONSTRAINT "FK_84a7299a7f5eeac049a8c545bc0" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "productId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "siteId" DROP NOT NULL`);
    await queryRunner.query(
      `CREATE INDEX "IDX_47594c1ce8314490ec0ddc7c75" ON "file" ("measurementDate", "siteId", "productId") `
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_eae532e4ae79b4fc1ff7d1197ad" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_0ff04a795b8f7e24950a62e6d4d" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
