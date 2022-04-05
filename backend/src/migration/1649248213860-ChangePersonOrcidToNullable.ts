import {MigrationInterface, QueryRunner} from "typeorm";

export class ChangePersonOrcidToNullable1649248213860 implements MigrationInterface {
    name = 'ChangePersonOrcidToNullable1649248213860'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" ALTER COLUMN "orcid" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "person"."orcid" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "person"."orcid" IS NULL`);
        await queryRunner.query(`ALTER TABLE "person" ALTER COLUMN "orcid" SET NOT NULL`);
    }

}
