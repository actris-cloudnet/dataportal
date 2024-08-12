import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryColumn } from "typeorm";
import { ProductVariable } from "./ProductVariable";
import { Instrument } from "./Instrument";

export enum ProductType {
  INSTRUMENT = "instrument",
  MODEL = "model",
  SYNERGETIC = "synergetic",
  EVALUATION = "evaluation",
  EXPERIMENTAL = "experimental",
  GEOPHYSICAL = "geophysical",
}

@Entity()
export class Product {
  @PrimaryColumn()
  id!: string;

  @Column()
  humanReadableName!: string;

  @Column()
  level!: string;

  @Column({ type: "enum", enum: ProductType, array: true, default: [] })
  type!: ProductType[];

  @Column({ default: false })
  experimental!: boolean;

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
