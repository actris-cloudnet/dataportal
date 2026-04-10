import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class NewsItem {
  @PrimaryGeneratedColumn("uuid")
  uuid!: string;

  @Column()
  title!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "date" })
  date!: Date;

  @Column({ unique: true })
  slug!: string;

  @Column({ default: false })
  draft!: boolean;
}
