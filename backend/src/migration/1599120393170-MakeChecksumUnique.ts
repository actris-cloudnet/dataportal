import {MigrationInterface, QueryRunner} from 'typeorm'

export class MakePidAndChecksumUnique1599120393170 implements MigrationInterface {
    name = 'MakePidAndChecksumUnique1599120393170'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file" ADD CONSTRAINT "UQ_7de5b3f9ee0d0c0b04b0c31daab" UNIQUE ("checksum")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "UQ_7de5b3f9ee0d0c0b04b0c31daab"`);
    }

}
