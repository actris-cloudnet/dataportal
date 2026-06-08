import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { InstrumentContact } from "./InstrumentContact";
import { UserAccount } from "./UserAccount";

@Entity()
export class Person {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ unique: true, nullable: true })
  orcid?: string;

  @Column({ type: "varchar", nullable: true, select: false })
  email?: string | null;

  @OneToOne(() => UserAccount, (user) => user.person, { nullable: true })
  userAccount!: UserAccount | null;

  @OneToMany(() => InstrumentContact, (contact) => contact.person)
  instrumentContacts!: InstrumentContact[];
}
