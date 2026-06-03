import { Column, Entity, PrimaryColumn, BeforeInsert, BeforeUpdate } from "typeorm";

@Entity()
export class Publication {
  @PrimaryColumn()
  pid!: string;

  @Column({ type: "text" })
  citation!: string;

  @Column()
  publishedAt!: Date;

  @Column()
  updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  updateDateInsert() {
    this.updatedAt = new Date();
  }
}
