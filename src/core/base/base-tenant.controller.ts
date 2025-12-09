import { Body, Get, Param, Patch, Delete, Post } from '@nestjs/common';
import { BaseTenantService } from './base-tenant.service';

export abstract class BaseTenantController<
  T extends { tenantId: string; id?: string },
  CreateDto = any,
  UpdateDto = any,
> {
  protected constructor(protected readonly service: BaseTenantService<T>) {}

  // En cada método, delegamos al servicio correspondiente
  @Post()
  create(@Body() dto: CreateDto) {
    return this.service.createForCurrentTenant(dto as any);
  }

  // Listar todos los ítems del tenant actual
  @Get()
  findAll() {
    return this.service.findAllForCurrentTenant();
  }

  // Obtener un ítem específico del tenant actual
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOneForCurrentTenant(id);
  }

  // Actualizar un ítem del tenant actual
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDto) {
    return this.service.updateForCurrentTenant(id, dto as any);
  }

  // Eliminar un ítem del tenant actual
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.removeForCurrentTenant(id);
    return { success: true };
  }
}
