import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { CoreModule } from 'src/core/core.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]),
  CoreModule,
],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}