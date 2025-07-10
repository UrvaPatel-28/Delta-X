import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { WorkshopEvent } from './workshop-event.entity';
import { Tenant } from './tenant.entity';
import {
  SubmissionStatus,
  ReviewStatus,
  AiFeedbackStatus,
} from '../common/enums';

export interface QuestionAnswer {
  questionId: string;
  answer: string | string[];
}

export interface CanvasData {
  sectionId: string;
  content: string[];
}

@Entity('workshop_submissions')
export class WorkshopSubmission extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_workshop_submissions_id',
  })
  id!: string;

  @Column({ type: 'uuid' })
  workshopEventId!: string;

  @ManyToOne(() => WorkshopEvent)
  @JoinColumn({
    name: 'workshopEventId',
    foreignKeyConstraintName: 'FK_workshop_submissions_workshop_event_id',
  })
  workshopEvent!: WorkshopEvent;

  @Column({ type: 'jsonb', default: '[]' })
  questionAnswers!: QuestionAnswer[];

  @Column({ type: 'jsonb', default: '[]' })
  canvasData!: CanvasData[];

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    enumName: 'submission_status_enum',
    default: SubmissionStatus.STARTED,
  })
  status!: SubmissionStatus;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.NONE,
    enumName: 'review_status_enum',
  })
  reviewStatus!: ReviewStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  participantIdentifier!: string | null;

  @Column({ type: 'text', nullable: true })
  feedbackContent!: string | null;

  @Column({
    type: 'enum',
    enum: AiFeedbackStatus,
    default: AiFeedbackStatus.PENDING,
    enumName: 'ai_feedback_status_enum',
  })
  aiFeedbackStatus!: AiFeedbackStatus;

  @Column({ type: 'jsonb', default: '{}', nullable: true })
  aiSuggestions!: Record<string, any> | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  aiThreadId!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  aiThreadLastUpdated!: Date | null;

  @Column({ type: 'uuid', nullable: false })
  tenantId!: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({
    name: 'tenantId',
    foreignKeyConstraintName: 'FK_workshop_submissions_tenant_id',
  })
  tenant!: Tenant;
}
