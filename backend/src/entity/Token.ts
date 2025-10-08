import { Column, Entity, PrimaryColumn, ManyToOne } from "typeorm";
import { timingSafeEqual, createHash } from "node:crypto";
import { UserAccount } from "./UserAccount";

@Entity()
export class Token {
  @PrimaryColumn("bytea")
  selector!: Buffer;

  @Column("bytea")
  verifierHash!: Buffer;

  @ManyToOne(() => UserAccount, { nullable: false })
  userAccount!: UserAccount;

  @Column()
  expiresAt!: Date;

  compareVerifier(verifier: Buffer) {
    return timingSafeEqual(this.verifierHash, hashVerifier(verifier));
  }
}

export function hashVerifier(verifier: Buffer) {
  return createHash("sha256").update(verifier).digest();
}
