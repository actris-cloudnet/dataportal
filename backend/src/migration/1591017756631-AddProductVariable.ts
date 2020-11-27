import {MigrationInterface, QueryRunner} from 'typeorm'

export class AddProductVariable1591017756631 implements MigrationInterface {
    name = 'AddProductVariable1591017756631'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "product_variable" ("id" character varying NOT NULL, "humanReadableName" character varying NOT NULL, "order" character varying NOT NULL, CONSTRAINT "PK_b934bb1d8b07039a36dde2c9d3c" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "visualization" DROP COLUMN "variableId"`, undefined);
        await queryRunner.query(`ALTER TABLE "visualization" DROP COLUMN "variableHumanReadableName"`, undefined);
        await queryRunner.query(`ALTER TABLE "visualization" ADD "productVariableId" character varying`, undefined);
        await queryRunner.query(`ALTER TABLE "visualization" ADD CONSTRAINT "FK_720a1b39bbc8938e3ececf56cbc" FOREIGN KEY ("productVariableId") REFERENCES "product_variable"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "visualization" DROP CONSTRAINT "FK_720a1b39bbc8938e3ececf56cbc"`, undefined);
        await queryRunner.query(`ALTER TABLE "visualization" DROP COLUMN "productVariableId"`, undefined);
        await queryRunner.query(`ALTER TABLE "visualization" ADD "variableHumanReadableName" character varying NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "visualization" ADD "variableId" character varying NOT NULL`, undefined);
        await queryRunner.query(`DROP TABLE "product_variable"`, undefined);
    }

}
