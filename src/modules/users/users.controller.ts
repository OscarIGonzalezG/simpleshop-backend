import { Controller, Post, Get, Body, Param, UseGuards, Patch, Delete, ParseUUIDPipe } from '@nestjs/common';

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

  // Listar usuarios del tenant (o Global si eres Super Admin)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get()
  async findAll() {
    // Si soy Super Admin, quiero ver TODOS. Si soy Owner, solo los mios.
    // (Ajuste rápido para soportar tu panel global)
    if (this.context.user?.role === UserRole.SUPER_ADMIN) {
        return this.usersService.findAllGlobal(); // Nuevo método
    }
    return this.usersService.findAllByTenant(this.context.tenantId!);
  }

  // Ver un usuario específico
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    if (this.context.user?.role === UserRole.SUPER_ADMIN) {
        return this.usersService.findById(id);
    }
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

  // 👇 1. ENDPOINT: KILL SWITCH (BLOQUEAR/DESBLOQUEAR)
  @Roles(UserRole.SUPER_ADMIN)
  @Patch(':id/status')
  async toggleStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.usersService.updateStatus(id, isActive);
  }

  // 👇 2. ENDPOINT: ADMIN RESET PASSWORD
  @Roles(UserRole.SUPER_ADMIN)
  @Patch(':id/admin-reset-password')
  async adminResetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('password') password: string, 
  ) {
    return this.usersService.adminResetPassword(id, password);
  }
}