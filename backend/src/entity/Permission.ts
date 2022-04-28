import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
} from 'typeorm'

import { Site } from './Site'

export enum PermissionType {
  canUpload = 'canUpload',
  canUploadModel = 'canUploadModel',
  canCalibrate = 'canCalibrate',
  canProcess = 'canProcess',
}

@Entity()
@Unique(['permission', 'site'])
export class Permission {
  @PrimaryGeneratedColumn()
  id?: number; 

  @Column()
  permission!: PermissionType;

  @ManyToOne(() => Site, (site) => site.permissions, {nullable: true} )
  site?: Site;
}
