import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TenantStatus } from '../common/enums';

@Entity('tenants')
export class Tenant extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_tenants_id' })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  domain!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  brandingConfig!: Record<string, any> | null;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.PENDING,
    enumName: 'tenant_status_enum',
  })
  status!: TenantStatus;
}
