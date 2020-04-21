import {MigrationInterface, QueryRunner} from "typeorm";

export class RenameTestToIsTestSite1587450842184 implements MigrationInterface {
    name = 'RenameTestToIsTestSite1587450842184'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "site" RENAME COLUMN "test" TO "isTestSite"`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "site" RENAME COLUMN "isTestSite" TO "test"`, undefined);
    }

}
