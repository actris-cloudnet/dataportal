import {MigrationInterface, QueryRunner} from 'typeorm'

export class AllowNullSize1604489422034 implements MigrationInterface {
    name = 'AllowNullSize1604489422034'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "upload" ALTER COLUMN "size" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "upload" ALTER COLUMN "size" SET NOT NULL`);
    }

}
