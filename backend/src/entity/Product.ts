import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryColumn } from "typeorm";
import { ProductVariable } from "./ProductVariable";
import { Instrument } from "./Instrument";

@Entity()
export class Product {
  @PrimaryColumn()
  id!: string;

  @Column()
  humanReadableName!: string;

  @Column()
  level!: string;

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
