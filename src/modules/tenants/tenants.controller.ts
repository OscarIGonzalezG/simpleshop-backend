import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';

import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('tenants')
@UseGuards(JwtAuthGuard) // Primero JWT
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Roles(UserRole.OWNER)
  @Post()
  create(@Body() dto: CreateTenantDto, @CurrentUser() user) {
    return this.tenantsService.create(dto, user);
  }

  @Roles(UserRole.OWNER)
  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Roles(UserRole.OWNER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Roles(UserRole.OWNER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Roles(UserRole.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
