import {MigrationInterface, QueryRunner} from "typeorm";

export class AddPermission1651126207363 implements MigrationInterface {
    name = 'AddPermission1651126207363'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "permission" ("id" SERIAL NOT NULL, "permission" character varying NOT NULL, "siteId" character varying, CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_account_permissions_permission" ("userAccountId" integer NOT NULL, "permissionId" integer NOT NULL, CONSTRAINT "PK_e14a5fbcd230726e5fec8a52a2b" PRIMARY KEY ("userAccountId", "permissionId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_82e013aa5ee3adefcbf8e7d642" ON "user_account_permissions_permission" ("userAccountId") `);
        await queryRunner.query(`CREATE INDEX "IDX_acedc388d22fa9f1a1087bd3a0" ON "user_account_permissions_permission" ("permissionId") `);
        await queryRunner.query(`ALTER TABLE "permission" ADD CONSTRAINT "FK_2e2fe8d82096768938904a4ab88" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_account_permissions_permission" ADD CONSTRAINT "FK_82e013aa5ee3adefcbf8e7d642c" FOREIGN KEY ("userAccountId") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_account_permissions_permission" ADD CONSTRAINT "FK_acedc388d22fa9f1a1087bd3a07" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_account_permissions_permission" DROP CONSTRAINT "FK_acedc388d22fa9f1a1087bd3a07"`);
        await queryRunner.query(`ALTER TABLE "user_account_permissions_permission" DROP CONSTRAINT "FK_82e013aa5ee3adefcbf8e7d642c"`);
        await queryRunner.query(`ALTER TABLE "permission" DROP CONSTRAINT "FK_2e2fe8d82096768938904a4ab88"`);
        await queryRunner.query(`DROP INDEX "IDX_acedc388d22fa9f1a1087bd3a0"`);
        await queryRunner.query(`DROP INDEX "IDX_82e013aa5ee3adefcbf8e7d642"`);
        await queryRunner.query(`DROP TABLE "user_account_permissions_permission"`);
        await queryRunner.query(`DROP TABLE "permission"`);
    }

}
