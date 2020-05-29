import {MigrationInterface, QueryRunner} from "typeorm";

export class AddVisualization1590665363665 implements MigrationInterface {
    name = 'AddVisualization1590665363665'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "visualization" ("filename" character varying NOT NULL, "variableId" character varying NOT NULL, "variableHumanReadableName" character varying NOT NULL, "sourceFileUuid" uuid, CONSTRAINT "PK_a6a969b7c745d56feb8b32bcd67" PRIMARY KEY ("filename"))`, undefined);
        await queryRunner.query(`ALTER TABLE "visualization" ADD CONSTRAINT "FK_a3b021457d018320765db7bc490" FOREIGN KEY ("sourceFileUuid") REFERENCES "file"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "visualization" DROP CONSTRAINT "FK_a3b021457d018320765db7bc490"`, undefined);
        await queryRunner.query(`DROP TABLE "visualization"`, undefined);
    }

}
