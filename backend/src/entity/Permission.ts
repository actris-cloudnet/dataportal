import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, ManyToMany, Unique } from "typeorm";

import { Site } from "./Site";
import { UserAccount } from "./UserAccount";

export enum PermissionType {
  canUpload = "canUpload",
  canUploadModel = "canUploadModel",
  canCalibrate = "canCalibrate",
  canProcess = "canProcess",
  canDelete = "canDelete",
  canGetStats = "canGetStats",
}

@Entity()
@Unique(["permission", "site"])
export class Permission {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  permission!: PermissionType;

  @ManyToOne(() => Site, (site) => site.permissions, { nullable: true })
  site?: Site;

  @ManyToMany(() => UserAccount, (userAccount) => userAccount.permissions)
  userAccounts!: UserAccount[];
}

export function permissionTypeFromString(roleStr: string): PermissionType | undefined {
  return (<any>PermissionType)[roleStr];
}
