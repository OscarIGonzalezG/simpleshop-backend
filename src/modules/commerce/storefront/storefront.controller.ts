import { Controller, Get, Param } from '@nestjs/common';
import { StorefrontService } from './storefront.service';

@Controller('storefront') 
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  // GET /api/storefront/:slug (Info de la tienda)
  @Get(':slug')
  async getStoreInfo(@Param('slug') slug: string) {
    return this.storefrontService.getStoreInfo(slug);
  }

  // GET /api/storefront/:slug/categories (Menú)
  @Get(':slug/categories')
  async getCategories(@Param('slug') slug: string) {
    return this.storefrontService.getCategories(slug);
  }

  // GET /api/storefront/:slug/products (Catálogo)
  @Get(':slug/products')
  async getProducts(@Param('slug') slug: string) {
    return this.storefrontService.getProducts(slug);
  }

  // GET /api/storefront/:slug/products/:productSlug (Detalle)
  @Get(':slug/products/:productSlug')
  async getProductDetail(
    @Param('slug') slug: string, 
    @Param('productSlug') productSlug: string
  ) {
    return this.storefrontService.getProductBySlug(slug, productSlug);
  }
}