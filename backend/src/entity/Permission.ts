import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, ManyToMany, Unique } from "typeorm";

import { Site } from "./Site";
import { UserAccount } from "./UserAccount";
import { Model } from "./Model";

export enum PermissionType {
  canUpload = "canUpload",
  canUploadModel = "canUploadModel",
  canCalibrate = "canCalibrate",
  canProcess = "canProcess",
  canDelete = "canDelete",
  canGetStats = "canGetStats",
  canAddPublication = "canAddPublication",
  canPublishTask = "canPublishTask",
}

@Entity()
@Unique(["permission", "site", "model"])
export class Permission {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  permission!: PermissionType;

  @ManyToOne(() => Site, (site) => site.permissions, { nullable: true })
  site!: Site | null;

  @ManyToOne(() => Model, { nullable: true })
  model!: Model | null;

  @ManyToMany(() => UserAccount, (userAccount) => userAccount.permissions)
  userAccounts!: UserAccount[];
}

export function permissionTypeFromString(roleStr: string): PermissionType | undefined {
  return (<any>PermissionType)[roleStr];
}
