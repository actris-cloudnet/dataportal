import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { ProductVariable } from "./ProductVariable";

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

  @OneToMany((_) => ProductVariable, (prodVar) => prodVar.product)
  variables!: ProductVariable[];
}
