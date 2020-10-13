import {MigrationInterface, QueryRunner} from "typeorm";

export class AddCollection1602581666718 implements MigrationInterface {
    name = 'AddCollection1602581666718'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "collection" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_3be7c065e8288915cd60b52bf0a" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE TABLE "collection_files_file" ("collectionUuid" uuid NOT NULL, "fileUuid" uuid NOT NULL, CONSTRAINT "PK_769caf6e6e7f33fd4a6ced04b26" PRIMARY KEY ("collectionUuid", "fileUuid"))`);
        await queryRunner.query(`CREATE INDEX "IDX_094919863be141393570945026" ON "collection_files_file" ("collectionUuid") `);
        await queryRunner.query(`CREATE INDEX "IDX_cf576dd45955b2a78d16227515" ON "collection_files_file" ("fileUuid") `);
        await queryRunner.query(`ALTER TABLE "instrument" ALTER COLUMN "humanReadableName" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ALTER COLUMN "createdAt" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ALTER COLUMN "updatedAt" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "collection_files_file" ADD CONSTRAINT "FK_094919863be141393570945026d" FOREIGN KEY ("collectionUuid") REFERENCES "collection"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "collection_files_file" ADD CONSTRAINT "FK_cf576dd45955b2a78d162275155" FOREIGN KEY ("fileUuid") REFERENCES "file"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collection_files_file" DROP CONSTRAINT "FK_cf576dd45955b2a78d162275155"`);
        await queryRunner.query(`ALTER TABLE "collection_files_file" DROP CONSTRAINT "FK_094919863be141393570945026d"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "instrument" ALTER COLUMN "humanReadableName" SET DEFAULT ''`);
        await queryRunner.query(`DROP INDEX "IDX_cf576dd45955b2a78d16227515"`);
        await queryRunner.query(`DROP INDEX "IDX_094919863be141393570945026"`);
        await queryRunner.query(`DROP TABLE "collection_files_file"`);
        await queryRunner.query(`DROP TABLE "collection"`);
    }

}
