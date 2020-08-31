import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIdFieldToUploadedMetadata1598441033679 implements MigrationInterface {
    name = 'AddIdFieldToUploadedMetadata1598441033679'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD "id" character varying(18) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP CONSTRAINT "PK_11dd39e009aacff3f24931e7eae"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD CONSTRAINT "PK_fd5803d4d32d211ba19b1d10bc8" PRIMARY KEY ("hash", "id")`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP CONSTRAINT "PK_fd5803d4d32d211ba19b1d10bc8"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD CONSTRAINT "PK_2b9995a191e92cb786dba509a33" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP COLUMN "hash"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD "hash" character varying(64) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD CONSTRAINT "UQ_11dd39e009aacff3f24931e7eae" UNIQUE ("hash")`);
        await queryRunner.query(`ALTER TYPE "public"."uploaded_metadata_status_enum" RENAME TO "uploaded_metadata_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "uploaded_metadata_status_enum" AS ENUM('created', 'uploaded', 'processed')`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ALTER COLUMN "status" TYPE "uploaded_metadata_status_enum" USING "status"::"text"::"uploaded_metadata_status_enum"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ALTER COLUMN "status" SET DEFAULT 'created'`);
        await queryRunner.query(`DROP TYPE "uploaded_metadata_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "uploaded_metadata_status_enum_old" AS ENUM('created', 'uploaded')`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ALTER COLUMN "status" TYPE "uploaded_metadata_status_enum_old" USING "status"::"text"::"uploaded_metadata_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ALTER COLUMN "status" SET DEFAULT 'created'`);
        await queryRunner.query(`DROP TYPE "uploaded_metadata_status_enum"`);
        await queryRunner.query(`ALTER TYPE "uploaded_metadata_status_enum_old" RENAME TO  "uploaded_metadata_status_enum"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP CONSTRAINT "UQ_11dd39e009aacff3f24931e7eae"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP COLUMN "hash"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD "hash" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP CONSTRAINT "PK_2b9995a191e92cb786dba509a33"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD CONSTRAINT "PK_fd5803d4d32d211ba19b1d10bc8" PRIMARY KEY ("hash", "id")`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP CONSTRAINT "PK_fd5803d4d32d211ba19b1d10bc8"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD CONSTRAINT "PK_11dd39e009aacff3f24931e7eae" PRIMARY KEY ("hash")`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP COLUMN "id"`);
    }

}
