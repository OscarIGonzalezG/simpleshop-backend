import { Controller, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { BaseTenantController } from '../../../core/base/base-tenant.controller';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard) // 🔒 Protegemos todo el controlador
export class ProductsController extends BaseTenantController<
  Product,
  CreateProductDto,
  UpdateProductDto
> {
  constructor(private readonly productsService: ProductsService) {
    super(productsService);
  }
  
  // La lógica de "POST create" heredada llamará al service,
  // y el service lanzará el error si supera los 50 productos.
}