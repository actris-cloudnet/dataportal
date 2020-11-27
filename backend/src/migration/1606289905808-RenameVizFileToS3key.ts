import {MigrationInterface, QueryRunner} from 'typeorm'

export class RenameVizFileToS3key1606289905808 implements MigrationInterface {
    name = 'RenameVizFileToS3key1606289905808'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "visualization" RENAME COLUMN "filename" TO "s3key"`);
        await queryRunner.query(`ALTER TABLE "visualization" RENAME CONSTRAINT "PK_a6a969b7c745d56feb8b32bcd67" TO "PK_41c98fa9d608e73db7880f8a1f2"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "visualization" RENAME CONSTRAINT "PK_41c98fa9d608e73db7880f8a1f2" TO "PK_a6a969b7c745d56feb8b32bcd67"`);
        await queryRunner.query(`ALTER TABLE "visualization" RENAME COLUMN "s3key" TO "filename"`);
    }

}
