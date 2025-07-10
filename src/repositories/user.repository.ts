import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantAwareRepository } from './tenant-aware.repository';
import { TenantContextService } from '../modules/tenants/tenant-context.service';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository extends TenantAwareRepository<User> {
  constructor(
    tenantContextService: TenantContextService,
    dataSource: DataSource,
  ) {
    super(tenantContextService, User, dataSource);
  }

  // Special method to find user by email without tenant context for authentication
  async findByEmailForAuth(email: string): Promise<User | null> {
    return this.manager.findOne(User, {
      where: { email },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'passwordHash',
        'role',
        'tenantId',
      ],
    });
  }
}
