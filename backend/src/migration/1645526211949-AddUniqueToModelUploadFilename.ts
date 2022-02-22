import {MigrationInterface, QueryRunner} from "typeorm";

export class AddUniqueToModelUploadFilename1645526211949 implements MigrationInterface {
    name = 'AddUniqueToModelUploadFilename1645526211949'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "model_upload"."filename" IS NULL`);
        await queryRunner.query(`ALTER TABLE "model_upload" ADD CONSTRAINT "UQ_7d1baf638db4876c37aa6025265" UNIQUE ("filename")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model_upload" DROP CONSTRAINT "UQ_7d1baf638db4876c37aa6025265"`);
        await queryRunner.query(`COMMENT ON COLUMN "model_upload"."filename" IS NULL`);
    }

}
