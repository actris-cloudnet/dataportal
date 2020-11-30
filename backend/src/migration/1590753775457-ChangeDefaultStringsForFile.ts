import {MigrationInterface, QueryRunner} from 'typeorm'

export class ChangeDefaultStringsForFile1590753775457 implements MigrationInterface {
    name = 'ChangeDefaultStringsForFile1590753775457'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`UPDATE "file" SET "pid" = '' WHERE "pid" IS NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "pid" SET NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "pid" SET DEFAULT ''`, undefined);
        await queryRunner.query(`UPDATE "file" SET "cloudnetpyVersion" = '' WHERE "cloudnetpyVersion" IS NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "cloudnetpyVersion" SET NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "cloudnetpyVersion" SET DEFAULT ''`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`UPDATE "file" SET "cloudnetpyVersion" = NULL WHERE "cloudnetpyVersion" = ''`, undefined);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "cloudnetpyVersion" DROP DEFAULT`, undefined);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "cloudnetpyVersion" DROP NOT NULL`, undefined);
        await queryRunner.query(`UPDATE "file" SET "pid" = NULL WHERE "pid" = ''`, undefined);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "pid" DROP DEFAULT`, undefined);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "pid" DROP NOT NULL`, undefined);
    }

}
