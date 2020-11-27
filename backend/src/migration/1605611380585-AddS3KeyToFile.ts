import {MigrationInterface, QueryRunner} from 'typeorm'

export class AddS3KeyToFile1605611380585 implements MigrationInterface {
    name = 'AddS3KeyToFile1605611380585'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file" ADD "s3key" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "s3key"`);
    }

}
