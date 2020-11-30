import {MigrationInterface, QueryRunner} from 'typeorm'

export class LinkSiteToUploadedMetadata1597314062388 implements MigrationInterface {
    name = 'LinkSiteToUploadedMetadata1597314062388'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD "siteId" character varying`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" ADD CONSTRAINT "FK_8c3a6b9b7bf50681a30bc06c703" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP CONSTRAINT "FK_8c3a6b9b7bf50681a30bc06c703"`);
        await queryRunner.query(`ALTER TABLE "uploaded_metadata" DROP COLUMN "siteId"`);
    }

}
