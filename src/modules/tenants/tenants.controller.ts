import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, ParseUUIDPipe } from '@nestjs/common';

import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('tenants')
@UseGuards(JwtAuthGuard) // Primero JWT
export class TenantsController {
constructor(private readonly tenantsService: TenantsService) {}

  @Roles(UserRole.OWNER, UserRole.SUPER_ADMIN) // 👈 Permitir Super Admin
  @Post()
  create(@Body() dto: CreateTenantDto, @CurrentUser() user) {
    return this.tenantsService.create(dto, user);
  }

  @Roles(UserRole.SUPER_ADMIN) // 👈 Solo Super Admin ve TODAS
  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Roles(UserRole.OWNER, UserRole.SUPER_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Roles(UserRole.OWNER, UserRole.SUPER_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  // 👇 NUEVO ENDPOINT: BLOQUEAR TIENDA (Solo Super Admin)
  @Roles(UserRole.SUPER_ADMIN)
  @Patch(':id/status')
  toggleStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.tenantsService.updateStatus(id, isActive);
  }

  @Roles(UserRole.SUPER_ADMIN) // 👈 Ojo: Borrar tienda es peligroso, solo Super Admin debería
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}