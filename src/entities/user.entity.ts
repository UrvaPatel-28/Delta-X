import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { Exclude } from 'class-transformer';
import { BaseEntity } from './base.entity';
import { UserRole } from '../common/enums';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_users_id' })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 100 })
  @Exclude()
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CONSULTANT,
    enumName: 'user_role_enum',
  })
  role!: UserRole;

  @Column({ type: 'uuid', nullable: false })
  tenantId!: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({
    name: 'tenantId',
    foreignKeyConstraintName: 'FK_users_tenant_id',
  })
  tenant!: Tenant;
}
