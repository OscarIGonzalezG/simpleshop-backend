import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { BaseTenantService } from '../../core/base/base-tenant.service';
import { RequestContextService } from '../../core/request-context/request-context.service';

@Injectable()
export class CategoriesService extends BaseTenantService<Category> {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    context: RequestContextService,
  ) {
    super(categoryRepo, context);
  }
}