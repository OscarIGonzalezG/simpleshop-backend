import { Controller, Post, Get, Body, Param, UseGuards, Patch, Delete } from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';
import { RequestContextService } from '../../core/request-context/request-context.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly context: RequestContextService,
  ) {}

  // Crear usuario (Solo Owner o Admin pueden crear Staff)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post()
  async create(@Body() dto: CreateUserDto) {
    // Forzamos que se cree dentro del tenant actual
    return this.usersService.create(dto, this.context.tenantId!);
  }

  // Listar usuarios del tenant
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get()
  async findAll() {
    return this.usersService.findAllByTenant(this.context.tenantId!);
  }

  // Ver un usuario específico (Protegido por Tenant)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOneByTenant(id, this.context.tenantId!);
  }

  // Actualizar usuario
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateByTenant(id, dto, this.context.tenantId!);
  }

  // Eliminar usuario
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.removeByTenant(id, this.context.tenantId!);
  }
}

