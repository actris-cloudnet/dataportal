import {MigrationInterface, QueryRunner} from "typeorm";

export class AddDataProcessingVersion1648199725352 implements MigrationInterface {
    name = 'AddDataProcessingVersion1648199725352'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file" ADD "dataProcessingVersion" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "regular_file" ADD "dataProcessingVersion" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "model_file" ADD "dataProcessingVersion" character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "dataProcessingVersion"`);
        await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "dataProcessingVersion"`);
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "dataProcessingVersion"`);
    }

}
