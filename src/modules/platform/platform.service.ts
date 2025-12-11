import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class PlatformService {
  constructor(private readonly dataSource: DataSource) {}

  async getGlobalMetrics() {
    // Usamos query builder o managers para contar TODO
    
    // 1. Total de Tiendas
    const totalTenants = await this.dataSource.getRepository(Tenant).count();
    
    // 2. Total de Usuarios Registrados
    const totalUsers = await this.dataSource.getRepository(User).count();

    // 3. Dinero Total Movido (Suma de todas las ventas de todos los tenants)
    const { totalRevenue } = await this.dataSource
      .getRepository(Order)
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'totalRevenue')
      .where('order.status = :status', { status: 'COMPLETED' })
      .getRawOne();

    // 4. Últimas 5 tiendas creadas (Log de actividad reciente)
    const recentTenants = await this.dataSource.getRepository(Tenant).find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      totalTenants,
      totalUsers,
      totalRevenue: totalRevenue || 0,
      recentTenants
    };
  }

  // 1. Obtener todas las tiendas
  async getAllTenants() {
    return this.dataSource.getRepository(Tenant).find({
      order: { createdAt: 'DESC' },
    });
  }

  // 2. Obtener todos los usuarios
  async getAllUsers() {
    return this.dataSource.getRepository(User).find({
      order: { createdAt: 'DESC' },
      relations: ['tenant'], // Para ver a qué tienda pertenecen
    });
  }

  // 3. Activar/Desactivar Tienda (Banear)
  async toggleTenantStatus(id: string) {
    const tenantRepo = this.dataSource.getRepository(Tenant);
    const tenant = await tenantRepo.findOneBy({ id });
    
    if (tenant) {
      console.log(`🔄 TOGGLE ANTES: ${tenant.businessName} estaba ${tenant.isActive}`); // 👈 Log 1
      
      tenant.isActive = !tenant.isActive; // Invertir valor
      
      const saved = await tenantRepo.save(tenant);
      console.log(`✅ TOGGLE DESPUÉS: Ahora está ${saved.isActive}`); // 👈 Log 2
      
      return saved;
    }
    
    console.warn(`❌ No se encontró el tenant ${id} para desactivar`);
    return null;
  }
}