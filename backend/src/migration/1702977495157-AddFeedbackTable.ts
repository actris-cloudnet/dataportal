import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFeedbackTable1702977495157 implements MigrationInterface {
  name = "AddFeedbackTable1702977495157";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "feedback" ("id" SERIAL NOT NULL, "name" text, "email" text, "message" text NOT NULL, "timestamp" TIMESTAMP NOT NULL, CONSTRAINT "PK_8389f9e087a57689cd5be8b2b13" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "feedback"`);
  }
}
