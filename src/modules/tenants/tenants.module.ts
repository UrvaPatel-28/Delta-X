import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantContextService } from './tenant-context.service';
import { Tenant } from '../../entities/tenant.entity';
import { TenantsController } from './tenants.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [TenantsController],
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class TenantsModule {}
