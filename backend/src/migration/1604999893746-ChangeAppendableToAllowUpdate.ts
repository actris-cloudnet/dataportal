import {MigrationInterface, QueryRunner} from "typeorm";

export class ChangeAppendableToAllowUpdate1604999893746 implements MigrationInterface {
    name = 'ChangeAppendableToAllowUpdate1604999893746'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "upload" RENAME COLUMN "appendable" TO "allowUpdate"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "upload" RENAME COLUMN "allowUpdate" TO "appendable"`);
    }

}
