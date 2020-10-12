import {MigrationInterface, QueryRunner} from "typeorm";

export class ChangeDefault1602430678303 implements MigrationInterface {
    name = 'ChangeDefault1602430678303'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ALTER COLUMN "createdAt" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ALTER COLUMN "updatedAt" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ALTER COLUMN "createdAt" SET DEFAULT now()`);
    }

}
