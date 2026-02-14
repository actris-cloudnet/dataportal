import { Column, Entity, Index, PrimaryGeneratedColumn, ManyToOne, ManyToMany, Unique } from "typeorm";

import { InstrumentInfo } from "./Instrument";
import { UserAccount } from "./UserAccount";

export enum InstrumentLogPermissionType {
  canReadLogs = "canReadLogs",
  canWriteLogs = "canWriteLogs",
}

@Entity()
@Unique(["permission", "instrumentInfo"])
@Index("IDX_instrument_log_permission_global", ["permission"], { where: '"instrumentInfoUuid" IS NULL', unique: true })
export class InstrumentLogPermission {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  permission!: InstrumentLogPermissionType;

  @ManyToOne(() => InstrumentInfo, { nullable: true })
  instrumentInfo!: InstrumentInfo | null;

  @ManyToMany(() => UserAccount, (userAccount) => userAccount.instrumentLogPermissions)
  userAccounts!: UserAccount[];
}

export function instrumentLogPermissionTypeFromString(str: string): InstrumentLogPermissionType | undefined {
  return (InstrumentLogPermissionType as any)[str];
}
