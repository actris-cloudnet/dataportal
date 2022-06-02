import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPublicationTable1647416469676 implements MigrationInterface {
  name = "AddPublicationTable1647416469676";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "publication" ("pid" character varying NOT NULL, "citation" text NOT NULL, "year" integer NOT NULL, "updatedAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_46ad015e4b7a277aee00e13f735" PRIMARY KEY ("pid"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "publication"`);
  }
}
