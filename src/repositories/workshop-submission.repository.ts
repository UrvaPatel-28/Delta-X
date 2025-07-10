import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantAwareRepository } from './tenant-aware.repository';
import { TenantContextService } from '../modules/tenants/tenant-context.service';
import { WorkshopSubmission } from '../entities/workshop-submission.entity';

@Injectable()
export class WorkshopSubmissionRepository extends TenantAwareRepository<WorkshopSubmission> {
  constructor(
    tenantContextService: TenantContextService,
    dataSource: DataSource,
  ) {
    super(tenantContextService, WorkshopSubmission, dataSource);
  }
}
