import {MigrationInterface, QueryRunner} from "typeorm";

export class AddInvalidStatus1629194180622 implements MigrationInterface {
    name = 'AddInvalidStatus1629194180622'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."upload_status_enum" RENAME TO "upload_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "upload_status_enum" AS ENUM('created', 'uploaded', 'processed', 'invalid')`);
        await queryRunner.query(`ALTER TABLE "upload" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "upload" ALTER COLUMN "status" TYPE "upload_status_enum" USING "status"::"text"::"upload_status_enum"`);
        await queryRunner.query(`ALTER TABLE "upload" ALTER COLUMN "status" SET DEFAULT 'created'`);
        await queryRunner.query(`COMMENT ON COLUMN "upload"."status" IS NULL`);
        await queryRunner.query(`CREATE TYPE "instrument_upload_status_enum" AS ENUM('created', 'uploaded', 'processed', 'invalid')`);
        await queryRunner.query(`ALTER TABLE "instrument_upload" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "instrument_upload" ALTER COLUMN "status" TYPE "instrument_upload_status_enum" USING "status"::"text"::"instrument_upload_status_enum"`);
        await queryRunner.query(`ALTER TABLE "instrument_upload" ALTER COLUMN "status" SET DEFAULT 'created'`);
        await queryRunner.query(`COMMENT ON COLUMN "instrument_upload"."status" IS NULL`);
        await queryRunner.query(`CREATE TYPE "model_upload_status_enum" AS ENUM('created', 'uploaded', 'processed', 'invalid')`);
        await queryRunner.query(`ALTER TABLE "model_upload" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "model_upload" ALTER COLUMN "status" TYPE "model_upload_status_enum" USING "status"::"text"::"model_upload_status_enum"`);
        await queryRunner.query(`ALTER TABLE "model_upload" ALTER COLUMN "status" SET DEFAULT 'created'`);
        await queryRunner.query(`COMMENT ON COLUMN "model_upload"."status" IS NULL`);
        await queryRunner.query(`ALTER TYPE "public"."misc_upload_status_enum" RENAME TO "misc_upload_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "misc_upload_status_enum" AS ENUM('created', 'uploaded', 'processed', 'invalid')`);
        await queryRunner.query(`ALTER TABLE "misc_upload" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "misc_upload" ALTER COLUMN "status" TYPE "misc_upload_status_enum" USING "status"::"text"::"misc_upload_status_enum"`);
        await queryRunner.query(`ALTER TABLE "misc_upload" ALTER COLUMN "status" SET DEFAULT 'created'`);
        await queryRunner.query(`COMMENT ON COLUMN "misc_upload"."status" IS NULL`);
        await queryRunner.query(`DROP TYPE "upload_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "misc_upload_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "misc_upload"."status" IS NULL`);
        await queryRunner.query(`CREATE TYPE "misc_upload_status_enum_old" AS ENUM('created', 'uploaded', 'processed')`);
        await queryRunner.query(`ALTER TABLE "misc_upload" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "misc_upload" ALTER COLUMN "status" TYPE "misc_upload_status_enum_old" USING "status"::"text"::"misc_upload_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "misc_upload" ALTER COLUMN "status" SET DEFAULT 'created'`);
        await queryRunner.query(`DROP TYPE "misc_upload_status_enum"`);
        await queryRunner.query(`ALTER TYPE "misc_upload_status_enum_old" RENAME TO  "misc_upload_status_enum"`);
        await queryRunner.query(`COMMENT ON COLUMN "model_upload"."status" IS NULL`);
        await queryRunner.query(`CREATE TYPE "model_upload_status_enum_old" AS ENUM()`);
        await queryRunner.query(`ALTER TABLE "model_upload" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "model_upload" ALTER COLUMN "status" TYPE "model_upload_status_enum_old" USING "status"::"text"::"model_upload_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "model_upload" ALTER COLUMN "status" SET DEFAULT 'created'`);
        await queryRunner.query(`DROP TYPE "model_upload_status_enum"`);
        await queryRunner.query(`ALTER TYPE "model_upload_status_enum_old" RENAME TO  "upload_status_enum"`);
        await queryRunner.query(`COMMENT ON COLUMN "instrument_upload"."status" IS NULL`);
        await queryRunner.query(`CREATE TYPE "instrument_upload_status_enum_old" AS ENUM()`);
        await queryRunner.query(`ALTER TABLE "instrument_upload" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "instrument_upload" ALTER COLUMN "status" TYPE "instrument_upload_status_enum_old" USING "status"::"text"::"instrument_upload_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "instrument_upload" ALTER COLUMN "status" SET DEFAULT 'created'`);
        await queryRunner.query(`DROP TYPE "instrument_upload_status_enum"`);
        await queryRunner.query(`ALTER TYPE "instrument_upload_status_enum_old" RENAME TO  "upload_status_enum"`);
        await queryRunner.query(`COMMENT ON COLUMN "upload"."status" IS NULL`);
        await queryRunner.query(`CREATE TYPE "upload_status_enum_old" AS ENUM('created', 'uploaded', 'processed')`);
        await queryRunner.query(`ALTER TABLE "upload" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "upload" ALTER COLUMN "status" TYPE "upload_status_enum_old" USING "status"::"text"::"upload_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "upload" ALTER COLUMN "status" SET DEFAULT 'created'`);
        await queryRunner.query(`DROP TYPE "upload_status_enum"`);
        await queryRunner.query(`ALTER TYPE "upload_status_enum_old" RENAME TO  "upload_status_enum"`);
    }

}
