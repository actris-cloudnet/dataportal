import { Column, Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable } from "typeorm";

import { Permission } from "./Permission";

@Entity()
export class UserAccount {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  passwordHash!: string;

  @ManyToMany(() => Permission, (permission) => permission.userAccounts)
  @JoinTable()
  permissions!: Permission[];
}
