import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { CanvasType, QuestionType } from '../common/enums';
import { Tenant } from './tenant.entity';

export interface WorkshopQuestion {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  expanded: boolean;
  options?: string[] | null;
}

export interface WorkshopCanvasSection {
  sectionId: string;
  title: string;
  aiInstructions: string;
  feedbackRules?: string | null;
  questions?: string[] | null;
}

@Entity('workshop_events')
export class WorkshopEvent extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_workshop_events_id',
  })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({
    type: 'enum',
    enum: CanvasType,
    enumName: 'canvas_type_enum',
  })
  canvasType!: CanvasType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  qrCodeUrl!: string | null;

  @Column({ type: 'boolean', default: true })
  isPublished!: boolean;

  @Column({ type: 'boolean', default: true })
  allowReviews!: boolean;

  @Column({ type: 'jsonb', default: '[]' })
  questions!: WorkshopQuestion[];

  @Column({ type: 'jsonb', default: '[]' })
  canvasSections!: WorkshopCanvasSection[];

  @Column({ type: 'uuid', nullable: false })
  tenantId!: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({
    name: 'tenantId',
    foreignKeyConstraintName: 'FK_workshop_events_tenant_id',
  })
  tenant!: Tenant;
}
