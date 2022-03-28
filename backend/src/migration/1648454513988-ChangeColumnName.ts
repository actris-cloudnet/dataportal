import {MigrationInterface, QueryRunner} from "typeorm";

export class ChangeColumnName1648454513988 implements MigrationInterface {
    name = 'ChangeColumnName1648454513988'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file" RENAME COLUMN "dataProcessingVersion" TO "processingVersion"`);
        await queryRunner.query(`ALTER TABLE "regular_file" RENAME COLUMN "dataProcessingVersion" TO "processingVersion"`);
        await queryRunner.query(`ALTER TABLE "model_file" RENAME COLUMN "dataProcessingVersion" TO "processingVersion"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model_file" RENAME COLUMN "processingVersion" TO "dataProcessingVersion"`);
        await queryRunner.query(`ALTER TABLE "regular_file" RENAME COLUMN "processingVersion" TO "dataProcessingVersion"`);
        await queryRunner.query(`ALTER TABLE "file" RENAME COLUMN "processingVersion" TO "dataProcessingVersion"`);
    }

}
