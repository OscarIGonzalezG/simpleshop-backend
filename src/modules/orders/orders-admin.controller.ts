import { Controller, Patch, Param, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { RequestContextService } from '../../core/request-context/request-context.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersAdminController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly context: RequestContextService,
  ) {}

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Patch(':id/cancel')
  async cancel(@Param('id') id: string, @CurrentUser() user) {
    return this.ordersService.cancelOrder(id, this.context.tenantId!, user.id);
  }
}