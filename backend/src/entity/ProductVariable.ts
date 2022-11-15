import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { Visualization } from "./Visualization";
import { Product } from "./Product";

@Entity()
export class ProductVariable {
  @PrimaryColumn()
  id!: string;

  @Column()
  humanReadableName!: string;

  @Column()
  order!: string;

  @Column({ type: "varchar", nullable: true })
  actrisVocabUri!: string | null;

  @OneToMany((_) => Visualization, (viz) => viz.productVariable)
  visualizations!: Visualization[];

  @ManyToOne((_) => Product, (prod) => prod.variables)
  product!: Product;

  constructor(
    id: string,
    humanReadableName: string,
    order: string,
    visualizations: Visualization[],
    product: Product,
    actrisVocabUri: string | null = null
  ) {
    this.id = id;
    this.humanReadableName = humanReadableName;
    this.order = order;
    this.visualizations = visualizations;
    this.product = product;
    this.actrisVocabUri = actrisVocabUri;
  }
}
