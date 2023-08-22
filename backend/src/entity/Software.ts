import { Column, Entity, Unique, PrimaryGeneratedColumn } from "typeorm";

@Entity()
@Unique(["code", "version"])
export class Software {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  code!: string;

  @Column()
  version!: string;

  @Column({ type: "text", nullable: true })
  humanReadableName!: string | null;

  @Column({ type: "text", nullable: true })
  url!: string | null;
}
