import { Column, Entity, BeforeInsert, BeforeUpdate } from "typeorm";

@Entity()
export class Calibration {
  @Column({ primary: true })
  instrumentPid!: string;

  @Column({ type: "date", primary: true })
  measurementDate!: string;

  @Column({ type: "jsonb" })
  data!: any;

  @Column()
  createdAt!: Date;

  @Column()
  updatedAt!: Date;

  @BeforeInsert()
  updateDateCreation() {
    this.createdAt = new Date();
    this.updatedAt = this.createdAt;
  }

  @BeforeUpdate()
  updateDateUpdate() {
    this.updatedAt = new Date();
  }
}
