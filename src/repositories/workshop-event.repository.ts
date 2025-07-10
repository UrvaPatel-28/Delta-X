import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantAwareRepository } from './tenant-aware.repository';
import { TenantContextService } from '../modules/tenants/tenant-context.service';
import { WorkshopEvent } from '../entities/workshop-event.entity';

@Injectable()
export class WorkshopEventRepository extends TenantAwareRepository<WorkshopEvent> {
  constructor(
    tenantContextService: TenantContextService,
    dataSource: DataSource,
  ) {
    super(tenantContextService, WorkshopEvent, dataSource);
  }
}
