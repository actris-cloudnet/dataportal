import {MigrationInterface, QueryRunner} from "typeorm";

export class ChangeIdToUuidInModelFiles1603375568869 implements MigrationInterface {
    name = 'ChangeIdToUuidInModelFiles1603375568869'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model_file" RENAME COLUMN "id" TO "uuid"`);
        await queryRunner.query(`ALTER TABLE "model_file" RENAME CONSTRAINT "PK_fc23a103c4a50db21fa83fc16ad" TO "PK_fc253af1bf074f42da1c667ac6b"`);
        await queryRunner.query(`ALTER SEQUENCE "model_file_id_seq" RENAME TO "model_file_uuid_seq"`);
        await queryRunner.query(`ALTER TABLE "model_file" DROP CONSTRAINT "PK_fc253af1bf074f42da1c667ac6b"`);
        await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "uuid"`);
        await queryRunner.query(`ALTER TABLE "model_file" ADD "uuid" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "model_file" ADD CONSTRAINT "PK_fc253af1bf074f42da1c667ac6b" PRIMARY KEY ("uuid")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model_file" DROP CONSTRAINT "PK_fc253af1bf074f42da1c667ac6b"`);
        await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "uuid"`);
        await queryRunner.query(`ALTER TABLE "model_file" ADD "uuid" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "model_file" ADD CONSTRAINT "PK_fc253af1bf074f42da1c667ac6b" PRIMARY KEY ("uuid")`);
        await queryRunner.query(`ALTER SEQUENCE "model_file_uuid_seq" RENAME TO "model_file_id_seq"`);
        await queryRunner.query(`ALTER TABLE "model_file" RENAME CONSTRAINT "PK_fc253af1bf074f42da1c667ac6b" TO "PK_fc23a103c4a50db21fa83fc16ad"`);
        await queryRunner.query(`ALTER TABLE "model_file" RENAME COLUMN "uuid" TO "id"`);
    }

}
