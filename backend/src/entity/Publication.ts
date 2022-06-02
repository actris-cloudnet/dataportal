import { Column, Entity, PrimaryColumn, BeforeInsert, BeforeUpdate } from "typeorm";

@Entity()
export class Publication {
  @PrimaryColumn()
  pid!: string;

  @Column({ type: "text" })
  citation!: string;

  @Column()
  year!: number;

  @Column()
  updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  updateDateInsert() {
    this.updatedAt = new Date();
  }
}
