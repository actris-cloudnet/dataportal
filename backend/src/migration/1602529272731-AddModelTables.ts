import {MigrationInterface, QueryRunner} from "typeorm";

export class AddModelTables1602529272731 implements MigrationInterface {
    name = 'AddModelTables1602529272731'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "model_site" ("id" character varying NOT NULL, "humanReadableName" character varying NOT NULL, "latitude" double precision NOT NULL, "longitude" double precision NOT NULL, "altitude" integer NOT NULL, "country" character varying NOT NULL, CONSTRAINT "PK_e16f020252cf749a3a6c5d2282e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "model_type" ("id" character varying NOT NULL, "order" integer NOT NULL, CONSTRAINT "PK_07ee45c1a0110c0bd57ed7b31c0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "model_file" ("uuid" uuid NOT NULL, "pid" character varying NOT NULL DEFAULT '', "volatile" boolean NOT NULL DEFAULT true, "measurementDate" date NOT NULL, "releasedAt" TIMESTAMP NOT NULL, "filename" character varying NOT NULL, "checksum" character varying NOT NULL, "size" integer NOT NULL, "format" character varying NOT NULL, "siteId" character varying, "modelTypeId" character varying, CONSTRAINT "UQ_c12dee99fecddb342ac1b1c865d" UNIQUE ("checksum"), CONSTRAINT "PK_fc253af1bf074f42da1c667ac6b" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4f448908b1b5e9e6c40e42a67c" ON "model_file" ("measurementDate", "siteId") `);
        await queryRunner.query(`ALTER TABLE "model_file" ADD CONSTRAINT "FK_2ebbfc653ad9fb831f332323b68" FOREIGN KEY ("siteId") REFERENCES "model_site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "model_file" ADD CONSTRAINT "FK_44e28963a66dcdd30f14eed4ada" FOREIGN KEY ("modelTypeId") REFERENCES "model_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model_file" DROP CONSTRAINT "FK_44e28963a66dcdd30f14eed4ada"`);
        await queryRunner.query(`ALTER TABLE "model_file" DROP CONSTRAINT "FK_2ebbfc653ad9fb831f332323b68"`);
        await queryRunner.query(`DROP INDEX "IDX_4f448908b1b5e9e6c40e42a67c"`);
        await queryRunner.query(`DROP TABLE "model_file"`);
        await queryRunner.query(`DROP TABLE "model_type"`);
        await queryRunner.query(`DROP TABLE "model_site"`);
    }

}
