import { Controller, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { BaseTenantController } from '../../../core/base/base-tenant.controller'; // Ajusta ruta
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard'; // Ajusta ruta

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
  
  // ¡Y YA ESTÁ!
  // Tienes POST, GET, PATCH, DELETE automáticos heredados de BaseTenantController.
}