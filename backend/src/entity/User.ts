import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({unique: true})
  username?: string;

  @Column()
  passwordHash?: string;
}
