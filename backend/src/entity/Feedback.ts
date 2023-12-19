import { Column, Entity, PrimaryGeneratedColumn, BeforeInsert } from "typeorm";

@Entity()
export class Feedback {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", nullable: true })
  name!: string | null;

  @Column({ type: "text", nullable: true })
  email!: string | null;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "timestamp" })
  timestamp!: Date;

  @BeforeInsert()
  addTimeStamp() {
    this.timestamp = new Date();
  }
}
