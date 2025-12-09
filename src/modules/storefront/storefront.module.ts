import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorefrontService } from './storefront.service';
import { StorefrontController } from './storefront.controller';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, Product, Category]),
  ],
  controllers: [StorefrontController],
  providers: [StorefrontService],
})
export class StorefrontModule {}