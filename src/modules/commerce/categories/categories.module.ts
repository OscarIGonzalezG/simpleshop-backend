import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category } from './entities/category.entity';
import { CoreModule } from '../../../core/core.module'; // ✅ Importante

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    CoreModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService], // Exportamos por si Products lo necesita
})
export class CategoriesModule {}