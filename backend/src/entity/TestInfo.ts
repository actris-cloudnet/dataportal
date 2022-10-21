import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class TestInfo {
  @PrimaryColumn({ type: "text" })
  testId!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text" })
  description!: string;
}
