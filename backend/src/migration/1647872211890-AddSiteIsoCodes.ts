import {MigrationInterface, QueryRunner} from "typeorm";

export class AddSiteIsoCodes1647872211890 implements MigrationInterface {
    name = 'AddSiteIsoCodes1647872211890'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "site" ADD "iso_3166_1_alpha_2" character(2)`);
        await queryRunner.query(`ALTER TABLE "site" ADD "iso_3166_2" character(6)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "iso_3166_2"`);
        await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "iso_3166_1_alpha_2"`);
    }

}
