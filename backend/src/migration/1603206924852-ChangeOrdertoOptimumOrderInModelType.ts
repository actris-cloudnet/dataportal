import {MigrationInterface, QueryRunner} from "typeorm";

export class ChangeOrdertoOptimumOrderInModelType1603206924852 implements MigrationInterface {
    name = 'ChangeOrdertoOptimumOrderInModelType1603206924852'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model_type" RENAME COLUMN "order" TO "optimumOrder"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model_type" RENAME COLUMN "optimumOrder" TO "order"`);
    }

}
