import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstrument1598262390766 implements MigrationInterface {
  name = "AddInstrument1598262390766";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "instrument" ("id" character varying NOT NULL, "productId" character varying, CONSTRAINT "PK_1707dc7e7c2845211b38bef3d29" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "instrument" ADD CONSTRAINT "FK_2cfa7bb87165cc2a842f092890d" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument" DROP CONSTRAINT "FK_2cfa7bb87165cc2a842f092890d"`);
    await queryRunner.query(`DROP TABLE "instrument"`);
  }
}
