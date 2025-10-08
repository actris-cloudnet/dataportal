import { Column, Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable, PrimaryColumn, ManyToOne } from "typeorm";
import { timingSafeEqual } from "node:crypto";
const md5 = require("apache-md5"); // eslint-disable-line @typescript-eslint/no-require-imports

import { Permission } from "./Permission";

@Entity()
export class UserAccount {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: "varchar", nullable: true, unique: true })
  username!: string | null;

  @Column({ type: "varchar", nullable: true, select: false })
  passwordHash!: string | null;

  @Column({ type: "varchar", nullable: true, unique: true, select: false })
  activationToken!: string | null;

  @Column({ type: "varchar", nullable: true })
  fullName!: string | null;

  @Column({ type: "varchar", nullable: true, unique: true })
  orcidId!: string | null;

  @ManyToMany(() => Permission, (permission) => permission.userAccounts)
  @JoinTable()
  permissions!: Permission[];

  setPassword(password: string) {
    this.passwordHash = md5(password);
  }

  comparePassword(password: string) {
    if (!this.passwordHash) return false;
    return timingSafeEqual(Buffer.from(md5(password, this.passwordHash)), Buffer.from(this.passwordHash));
  }
}
