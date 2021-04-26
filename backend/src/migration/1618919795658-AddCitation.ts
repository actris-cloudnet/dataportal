import {MigrationInterface, QueryRunner} from "typeorm";

export class AddCitation1618919795658 implements MigrationInterface {
    name = 'AddCitation1618919795658'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "citation" ("id" character varying NOT NULL, "acknowledgements" text NOT NULL, CONSTRAINT "PK_f02dfdce6c05dfbf2fead28d0b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "regular_citation" ("id" character varying NOT NULL, "acknowledgements" text NOT NULL, CONSTRAINT "PK_d41b378d464002b32b55049543b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "model_citation" ("id" character varying NOT NULL, "acknowledgements" text NOT NULL, CONSTRAINT "PK_cfa2d11479171f49e8d8f12ff04" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "model_citations_model_citation" ("modelId" character varying NOT NULL, "modelCitationId" character varying NOT NULL, CONSTRAINT "PK_97e977fae702ddd1531f9a58f45" PRIMARY KEY ("modelId", "modelCitationId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5f45a6795d6bbc34540801085b" ON "model_citations_model_citation" ("modelId") `);
        await queryRunner.query(`CREATE INDEX "IDX_387ab395ed4ead1b652543f9ad" ON "model_citations_model_citation" ("modelCitationId") `);
        await queryRunner.query(`CREATE TABLE "site_citations_regular_citation" ("siteId" character varying NOT NULL, "regularCitationId" character varying NOT NULL, CONSTRAINT "PK_ae102e9377f3411d40228981b86" PRIMARY KEY ("siteId", "regularCitationId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_433aa5ea62b71e92ab0d29728d" ON "site_citations_regular_citation" ("siteId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5a2e55aad5ca015541726b53c6" ON "site_citations_regular_citation" ("regularCitationId") `);
        await queryRunner.query(`ALTER TABLE "model_citations_model_citation" ADD CONSTRAINT "FK_5f45a6795d6bbc34540801085ba" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "model_citations_model_citation" ADD CONSTRAINT "FK_387ab395ed4ead1b652543f9ad0" FOREIGN KEY ("modelCitationId") REFERENCES "model_citation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "site_citations_regular_citation" ADD CONSTRAINT "FK_433aa5ea62b71e92ab0d29728d4" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "site_citations_regular_citation" ADD CONSTRAINT "FK_5a2e55aad5ca015541726b53c6f" FOREIGN KEY ("regularCitationId") REFERENCES "regular_citation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "site_citations_regular_citation" DROP CONSTRAINT "FK_5a2e55aad5ca015541726b53c6f"`);
        await queryRunner.query(`ALTER TABLE "site_citations_regular_citation" DROP CONSTRAINT "FK_433aa5ea62b71e92ab0d29728d4"`);
        await queryRunner.query(`ALTER TABLE "model_citations_model_citation" DROP CONSTRAINT "FK_387ab395ed4ead1b652543f9ad0"`);
        await queryRunner.query(`ALTER TABLE "model_citations_model_citation" DROP CONSTRAINT "FK_5f45a6795d6bbc34540801085ba"`);
        await queryRunner.query(`DROP INDEX "IDX_5a2e55aad5ca015541726b53c6"`);
        await queryRunner.query(`DROP INDEX "IDX_433aa5ea62b71e92ab0d29728d"`);
        await queryRunner.query(`DROP TABLE "site_citations_regular_citation"`);
        await queryRunner.query(`DROP INDEX "IDX_387ab395ed4ead1b652543f9ad"`);
        await queryRunner.query(`DROP INDEX "IDX_5f45a6795d6bbc34540801085b"`);
        await queryRunner.query(`DROP TABLE "model_citations_model_citation"`);
        await queryRunner.query(`DROP TABLE "model_citation"`);
        await queryRunner.query(`DROP TABLE "regular_citation"`);
        await queryRunner.query(`DROP TABLE "citation"`);
    }

}
