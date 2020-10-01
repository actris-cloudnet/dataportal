import {MigrationInterface, QueryRunner} from "typeorm";

export class AddCreatedAtAndUpdatedAtToUploadedMetadata1601296700859 implements MigrationInterface {
    name = 'AddCreatedAtAndUpdatedAtToUploadedMetadata1601296700859'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP COLUMN "createdAt"`);
    }

}
