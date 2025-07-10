import { Injectable, Logger, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private readonly logger = new Logger(TenantContextService.name);
  private tenantId: string;

  setTenantId(tenantId: string) {
    if (!tenantId) {
      this.logger.warn('Attempted to set null or empty tenant ID');
      throw new Error('Cannot set empty tenant ID');
    }
    this.logger.debug(`Setting tenant ID: ${tenantId}`);
    this.tenantId = tenantId;
  }

  getTenantId(): string {
    if (!this.tenantId) {
      this.logger.error('TenantId not set in context');
      throw new Error('TenantId not set in context');
    }
    return this.tenantId;
  }

  hasTenantId(): boolean {
    return !!this.tenantId;
  }
}
