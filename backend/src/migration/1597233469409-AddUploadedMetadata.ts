import {MigrationInterface, QueryRunner} from "typeorm";

export class AddUploadedMetadata1597233469409 implements MigrationInterface {
    name = 'AddUploadedMetadata1597233469409'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "uploaded_metadata" ("hash" character varying NOT NULL, "filename" character varying NOT NULL, "measurementDate" date NOT NULL, CONSTRAINT "PK_11dd39e009aacff3f24931e7eae" PRIMARY KEY ("hash"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "uploaded_metadata"`);
    }

}
