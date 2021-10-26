import {MigrationInterface, QueryRunner} from "typeorm";

export class ChageSizeToBigint1620722887335 implements MigrationInterface {
    name = 'ChageSizeToBigint1620722887335'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "upload" ALTER COLUMN "size" TYPE bigint`);
        await queryRunner.query(`ALTER TABLE "instrument_upload" ALTER COLUMN "size" TYPE bigint`);
        await queryRunner.query(`ALTER TABLE "model_upload" ALTER COLUMN "size" TYPE bigint`);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "size" TYPE bigint`);
        await queryRunner.query(`ALTER TABLE "regular_file" ALTER COLUMN "size" TYPE bigint`);
        await queryRunner.query(`ALTER TABLE "model_file" ALTER COLUMN "size" TYPE bigint`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
