import { Controller, Post, Body, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { UserRole } from '../../iam/users/enums/user-role.enum';
import { RequestContextService } from '../../../core/request-context/request-context.service';

@Controller('security')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SecurityController {
  constructor(
    private readonly securityService: SecurityService,
    private readonly context: RequestContextService
  ) {}

  @Get('blocked-ips')
  findAll() {
    return this.securityService.findAll();
  }

  @Post('block-ip')
  blockIp(@Body() body: { ip: string; reason?: string }) {
    const adminEmail = this.context.user?.email || 'System';
    return this.securityService.blockIp(body.ip, body.reason || 'Manual Audit Block', adminEmail);
  }

  @Delete('unblock-ip/:ip')
  unblockIp(@Param('ip') ip: string) {
    const adminEmail = this.context.user?.email || 'System';
    return this.securityService.unblockIp(ip, adminEmail);
  }
}