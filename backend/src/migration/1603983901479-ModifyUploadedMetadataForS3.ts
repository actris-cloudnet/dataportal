import {MigrationInterface, QueryRunner} from 'typeorm'

export class ModifyUploadedMetadataForS31603983901479 implements MigrationInterface {
    name = 'ModifyUploadedMetadataForS31603983901479'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP CONSTRAINT "PK_2b9995a191e92cb786dba509a33"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP CONSTRAINT "UQ_11dd39e009aacff3f24931e7eae"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP COLUMN "hash"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD "uuid" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD CONSTRAINT "PK_47439ec1e1986f4673ba6ecaccb" PRIMARY KEY ("uuid")`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD "hashSum" character varying(32) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD CONSTRAINT "UQ_c66b237bc100e5b32a3c9fd7932" UNIQUE ("hashSum")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP CONSTRAINT "UQ_c66b237bc100e5b32a3c9fd7932"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP COLUMN "hashSum"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP CONSTRAINT "PK_47439ec1e1986f4673ba6ecaccb"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP COLUMN "uuid"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD "hash" character varying(64) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD CONSTRAINT "UQ_11dd39e009aacff3f24931e7eae" UNIQUE ("hash")`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD "id" character varying(18) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD CONSTRAINT "PK_2b9995a191e92cb786dba509a33" PRIMARY KEY ("id")`);
    }

}
