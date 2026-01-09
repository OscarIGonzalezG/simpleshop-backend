import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { CoreModule } from 'src/core/core.module';
import { Tenant } from 'src/modules/saas/tenants/entities/tenant.entity';// 👈 IMPORTANTE

@Module({
  imports: [
    // 👇 Agregamos Tenant aquí para poder validar el plan FREE (Límite 50 productos)
    TypeOrmModule.forFeature([Product, Tenant]), 
    CoreModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}