import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('platform')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN) // 🔒 Todo el controlador protegido
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('metrics')
  getMetrics() {
    return this.platformService.getGlobalMetrics();
  }

  // 👇 NUEVOS ENDPOINTS
  @Get('tenants')
  getTenants() {
    return this.platformService.getAllTenants();
  }

  @Get('users')
  getUsers() {
    return this.platformService.getAllUsers();
  }

  @Patch('tenants/:id/toggle')
  toggleTenant(@Param('id') id: string) {
    return this.platformService.toggleTenantStatus(id);
  }
}