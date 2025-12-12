import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from './entities/category.entity';
import { BaseTenantService } from '../../core/base/base-tenant.service';
import { RequestContextService } from '../../core/request-context/request-context.service';
import { LoggerService } from '../../core/logger/logger.service'; // 👈 Importar
import { LogLevel } from '../../core/logger/enums/log-level.enum';

@Injectable()
export class CategoriesService extends BaseTenantService<Category> {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    context: RequestContextService,
    private readonly logger: LoggerService, // 👈 Inyectar
  ) {
    super(categoryRepo, context);
  }

  // Sobrescribimos create para auditar
  async createForCurrentTenant(data: any): Promise<Category> {
    const category = await super.createForCurrentTenant(data);
    
    this.logger.audit(
      'CATEGORY_CREATE', 
      `Categoría creada: ${category.name}`, 
      LogLevel.INFO,
      { id: category.id }
    );
    
    return category;
  }

  async updateForCurrentTenant(id: string, data: any): Promise<Category> {
    const category = await super.updateForCurrentTenant(id, data);
    
    this.logger.audit(
      'CATEGORY_UPDATE', 
      `Categoría actualizada: ${category.name}`, 
      LogLevel.INFO
    );

    return category;
  }

  async removeForCurrentTenant(id: string): Promise<void> {
    // Obtenemos el nombre antes de borrar para el log
    const category = await this.findOneForCurrentTenant(id);
    await super.removeForCurrentTenant(id);

    this.logger.audit(
      'CATEGORY_DELETE', 
      `Categoría eliminada: ${category.name}`, 
      LogLevel.WARN
    );
  }
}