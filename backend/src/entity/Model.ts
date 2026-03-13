import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryColumn } from "typeorm";
import { ModelFile } from "./File";
import { ModelCitation } from "./Citation";

@Entity()
export class Model {
  @PrimaryColumn()
  id!: string;

  @Column()
  humanReadableName!: string;

  @Column()
  optimumOrder!: number;

  @ManyToOne((_) => Model, { nullable: true })
  sourceModel!: Model | null;

  @Column({ nullable: true })
  sourceModelId!: string | null;

  @Column({ type: "int", nullable: true })
  forecastStart!: number | null;

  @Column({ type: "int", nullable: true })
  forecastEnd!: number | null;

  @ManyToMany((_) => ModelCitation)
  @JoinTable()
  citations!: ModelCitation[];
}
