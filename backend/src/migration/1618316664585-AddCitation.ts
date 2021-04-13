import {MigrationInterface, QueryRunner} from "typeorm";

export class AddCitation1618316664585 implements MigrationInterface {
    name = 'AddCitation1618316664585'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "citation" ("id" SERIAL NOT NULL, "acknowledgements" text NOT NULL, "siteId" character varying, CONSTRAINT "PK_f02dfdce6c05dfbf2fead28d0b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "citation" ADD CONSTRAINT "FK_f0d50108a29ff7afc47b1b4da85" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "citation" DROP CONSTRAINT "FK_f0d50108a29ff7afc47b1b4da85"`);
        await queryRunner.query(`DROP TABLE "citation"`);
    }

}
