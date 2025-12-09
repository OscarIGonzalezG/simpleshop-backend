import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository, FindOptionsWhere } from 'typeorm';
import { RequestContextService } from '../request-context/request-context.service';

/**
 * BaseTenantService
 *
 * Servicio base para ENTIDADES multi-tenant con columna tenantId.
 *
 * NOTA:
 *  - T SIEMPRE debe tener `tenantId: string`
 *  - No debe usarse para Tenant
 */
export abstract class BaseTenantService<
  T extends { tenantId: string; id?: string }
> {
  protected constructor(
    protected readonly repository: Repository<T>,
    protected readonly context: RequestContextService,
  ) {}

  /**
   * tenantId actual desde contexto
   */
  protected get currentTenantId(): string {
    const tenantId = this.context.tenantId;

    if (!tenantId) {
      throw new ForbiddenException(
        'No hay tenantId en el contexto. Asegúrate de estar autenticado.',
      );
    }

    return tenantId;
  }

  /**
   * Helper para filtros con tenantId
   */
  protected buildTenantWhere(
    extra: FindOptionsWhere<T> = {} as FindOptionsWhere<T>,
  ): FindOptionsWhere<T> {
    return {
      ...(extra as any),
      tenantId: this.currentTenantId,
    };
  }

  // =====================================================
  //                  CRUD GENÉRICO
  // =====================================================

  // Crear un ítem para el tenant actual
  async createForCurrentTenant(data: Partial<T>): Promise<T> {
    // TypeORM create(): usamos cast seguro para evitar error TS
    const entity = this.repository.create({
      ...(data as any),
      tenantId: this.currentTenantId,
    } as T);

    return await this.repository.save(entity);
  }

  // Listar todos los ítems del tenant actual
  async findAllForCurrentTenant(): Promise<T[]> {
    return await this.repository.find({
      where: this.buildTenantWhere(),
    } as any);
  }

  // Obtener un ítem específico del tenant actual
  async findOneForCurrentTenant(id: string): Promise<T> {
    const entity = await this.repository.findOne({
      where: this.buildTenantWhere({ id } as any),
    } as any);

    if (!entity) {
      throw new NotFoundException('Recurso no encontrado para este tenant');
    }

    return entity;
  }

  // Actualizar un ítem del tenant actual
  async updateForCurrentTenant(id: string, data: Partial<T>): Promise<T> {
    const entity = await this.findOneForCurrentTenant(id);

    Object.assign(entity, data);

    return await this.repository.save(entity);
  }

  // Eliminar un ítem del tenant actual
  async removeForCurrentTenant(id: string): Promise<void> {
    const entity = await this.findOneForCurrentTenant(id);
    await this.repository.remove(entity);
  }
}
