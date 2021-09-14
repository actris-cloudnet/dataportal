import {MigrationInterface, QueryRunner} from "typeorm";

export class AddQualityScoreToSearchFile1630930366314 implements MigrationInterface {
    name = 'AddQualityScoreToSearchFile1630930366314'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "search_file" ADD "qualityScore" double precision`);
        await queryRunner.query(`UPDATE search_file SET "qualityScore" = regular_file."qualityScore" FROM regular_file WHERE search_file.uuid = regular_file.uuid`);
        await queryRunner.query(`UPDATE search_file SET "qualityScore" = model_file."qualityScore" FROM model_file WHERE search_file.uuid = model_file.uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "search_file" DROP COLUMN "qualityScore"`);
    }

}
