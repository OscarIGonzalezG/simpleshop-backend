import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { Order } from '../orders/entities/order.entity';
import { SystemLog } from 'src/core/logger/entities/system-log.entity';
import { LoggerService } from '../../core/logger/logger.service'; // 👈

@Injectable()
export class PlatformService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: LoggerService,

    // 👇 Inyectamos el repositorio de Logs
    @InjectRepository(SystemLog)
    private readonly logRepo: Repository<SystemLog>,
  ) {}

  async getGlobalMetrics() {
    const totalTenants = await this.dataSource.getRepository(Tenant).count();
    const totalUsers = await this.dataSource.getRepository(User).count();
    const { totalRevenue } = await this.dataSource.getRepository(Order)
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'totalRevenue')
      .where('order.status = :status', { status: 'COMPLETED' })
      .getRawOne();
      
    const recentTenants = await this.dataSource.getRepository(Tenant).find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return { totalTenants, totalUsers, totalRevenue: totalRevenue || 0, recentTenants };
  }

  async getAllTenants() {
    return this.dataSource.getRepository(Tenant).find({ order: { createdAt: 'DESC' } });
  }

  async getAllUsers() {
    return this.dataSource.getRepository(User).find({ order: { createdAt: 'DESC' }, relations: ['tenant'] });
  }

  // 👇 NUEVO MÉTODO: Obtener logs del sistema
  async getAllLogs() {
    return this.logRepo.find({
      order: { createdAt: 'DESC' }, // Los más recientes primero
      take: 100, // Límite de 100 para no saturar la pantalla
    });
  }

  // 🛡️ KILL SWITCH MANUAL
  async toggleTenantStatus(id: string) {
    const tenantRepo = this.dataSource.getRepository(Tenant);
    const tenant = await tenantRepo.findOne({ where: { id }, relations: ['owner'] });
    
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    // Protección Anti-Suicidio (No bloquear al Super Admin)
    if (tenant.owner && tenant.owner.role === UserRole.SUPER_ADMIN) {
      this.logger.warn(`Intento de bloquear tienda Super Admin: ${tenant.slug}`);
      throw new ForbiddenException('No puedes desactivar la tienda principal.');
    }

    tenant.isActive = !tenant.isActive;
    const saved = await tenantRepo.save(tenant);

    // 📝 Auditoría
    const status = saved.isActive ? 'ACTIVADO' : 'SUSPENDIDO';
    await this.logger.security(
      'TENANT_STATUS_CHANGE', 
      `Tienda ${saved.slug} ha sido ${status} manualmente.`
    );

    return saved;
  }
}