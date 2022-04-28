import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
} from 'typeorm'

import { Site } from './Site'

export enum PermissionType {
  canUpload = 'canUpload',
  canUploadModel = 'canUploadModel',
  canCalibrate = 'canCalibrate',
  canProcess = 'canProcess',
}

@Entity()
export class Permission {
  @PrimaryGeneratedColumn()
  id?: number; 

  @Column()
  permission!: PermissionType;

  @ManyToOne(() => Site, (site) => site.permissions, {nullable: true} )
  site?: Site;
}
