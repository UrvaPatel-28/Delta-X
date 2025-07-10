import { TenantContextService } from '../modules/tenants/tenant-context.service';
import {
  DataSource,
  EntityTarget,
  Repository,
  FindOptionsWhere,
  DeepPartial,
  ObjectLiteral,
  FindManyOptions,
  SaveOptions,
  SelectQueryBuilder,
  FindOneOptions,
  FindOptionsRelations,
  In,
  FindOperator,
  WhereExpressionBuilder,
} from 'typeorm';

export class TenantAwareRepository<
  T extends ObjectLiteral & { tenantId: string; id: string },
> extends Repository<T> {
  constructor(
    private tenantContextService: TenantContextService,
    entityClass: EntityTarget<T>,
    dataSource: DataSource,
  ) {
    super(entityClass, dataSource.createEntityManager());
  }

  protected withTenant(where: FindOptionsWhere<T> = {}): FindOptionsWhere<T> {
    console.log('====', this.tenantContextService.getTenantId());
    return {
      ...where,
      tenantId: this.tenantContextService.getTenantId(),
    } as FindOptionsWhere<T>;
  }

  async find(options: FindManyOptions<T> = {}) {
    return super.find({
      ...options,
      where: this.withTenant(options.where as FindOptionsWhere<T>),
    });
  }

  async findOne(options: FindOneOptions<T>) {
    return super.findOne({
      ...options,
      where: this.withTenant(options.where as FindOptionsWhere<T>),
    });
  }

  async findOneBy(where: FindOptionsWhere<T>) {
    return super.findOneBy(this.withTenant(where));
  }

  async findOneOrFail(options: FindOneOptions<T>) {
    return super.findOneOrFail({
      ...options,
      where: this.withTenant(options.where as FindOptionsWhere<T>),
    });
  }

  async findAndCount(options: FindManyOptions<T> = {}) {
    return super.findAndCount({
      ...options,
      where: this.withTenant(options.where as FindOptionsWhere<T>),
    });
  }

  async findByIds(ids: string[], relations?: FindOptionsRelations<T>) {
    return super.find({
      where: this.withTenant({
        id: In(ids) as FindOperator<string>,
      } as FindOptionsWhere<T>),
      relations,
    });
  }

  async count(options: FindManyOptions<T> = {}) {
    return super.count({
      ...options,
      where: this.withTenant(options.where as FindOptionsWhere<T>),
    });
  }

  async exists(options: FindManyOptions<T> = {}) {
    return super.exists({
      ...options,
      where: this.withTenant(options.where as FindOptionsWhere<T>),
    });
  }

  async save<E extends DeepPartial<T>>(
    entityOrEntities: E | E[],
    options?: SaveOptions,
  ) {
    const tenantId = this.tenantContextService.getTenantId();

    if (Array.isArray(entityOrEntities)) {
      return super.save(
        entityOrEntities.map((entity) => ({
          ...entity,
          tenantId,
        })),
        options,
      );
    }

    return super.save(
      {
        ...entityOrEntities,
        tenantId,
      },
      options,
    );
  }

  async update(criteria: FindOptionsWhere<T>, partialEntity: DeepPartial<T>) {
    return super.update(this.withTenant(criteria), partialEntity);
  }

  async upsert(entity: DeepPartial<T>, conflictPathsOrOptions: string[]) {
    const tenantId = this.tenantContextService.getTenantId();
    return super.upsert(
      {
        ...entity,
        tenantId,
      },
      conflictPathsOrOptions,
    );
  }

  async delete(criteria: FindOptionsWhere<T>) {
    return super.delete(this.withTenant(criteria));
  }

  async softDelete(criteria: FindOptionsWhere<T>) {
    return super.softDelete(this.withTenant(criteria));
  }

  async restore(criteria: FindOptionsWhere<T>) {
    return super.restore(this.withTenant(criteria));
  }

  getTenantAwareQueryBuilder(alias: string): SelectQueryBuilder<T> {
    const tenantId = this.tenantContextService.getTenantId();
    const qb = this.createQueryBuilder(alias);

    // Store the original where method
    const originalWhere = qb.where;

    // Replace with a version that adds the tenant filter
    qb.where = function (this: WhereExpressionBuilder, ...args: any[]) {
      // Call the original where method with the provided arguments
      const result = originalWhere.apply(this, args);
      // Add tenant filter
      this.andWhere(`${alias}.tenantId = :tenantId`, {
        tenantId,
      });
      return result;
    };

    return qb;
  }
}
