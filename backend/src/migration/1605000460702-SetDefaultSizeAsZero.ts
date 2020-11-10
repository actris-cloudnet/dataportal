import {MigrationInterface, QueryRunner} from "typeorm";

export class SetDefaultSizeAsZero1605000460702 implements MigrationInterface {
    name = 'SetDefaultSizeAsZero1605000460702'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "upload" ALTER COLUMN "size" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "upload" ALTER COLUMN "size" SET DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "upload" ALTER COLUMN "size" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "upload" ALTER COLUMN "size" DROP NOT NULL`);
    }

}
