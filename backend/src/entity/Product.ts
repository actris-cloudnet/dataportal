import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryColumn } from "typeorm";
import { ProductVariable } from "./ProductVariable";
import { Instrument } from "./Instrument";

export enum ProductType {
  INSTRUMENT = "instrument",
  MODEL = "model",
  GEOPHYSICAL = "geophysical",
  EVALUATION = "evaluation",
  EXPERIMENTAL = "experimental",
}

@Entity()
export class Product {
  @PrimaryColumn()
  id!: string;

  @Column()
  humanReadableName!: string;

  @Column({ type: "text", array: true })
  type!: ProductType[];

  @Column({ default: false })
  experimental!: boolean;

  @Column({ default: true })
  downloadable!: boolean;

  @OneToMany(() => ProductVariable, (prodVar) => prodVar.product)
  variables!: ProductVariable[];

  @ManyToMany(() => Instrument, (instrument) => instrument.derivedProducts)
  sourceInstruments!: Instrument[];

  @ManyToMany(() => Product, (product) => product.derivedProducts)
  @JoinTable()
  sourceProducts!: Product[];

  @ManyToMany(() => Product, (product) => product.sourceProducts)
  derivedProducts!: Product[];
}
