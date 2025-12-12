import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { User } from '../users/entities/user.entity';
import { LoggerService } from '../../core/logger/logger.service';
import { LogLevel } from '../../core/logger/enums/log-level.enum'; // 👈 IMPORTANTE

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateTenantDto, owner: User) {
    const tenant = this.tenantRepository.create({ ...dto, owner });
    return this.tenantRepository.save(tenant);
  }

  async findOne(id: string) {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return tenant;
  }

  async findByEmail(email: string) {
    return this.tenantRepository.findOne({ where: { email } });
  }

  async findOneBySlug(slug: string) {
    return this.tenantRepository.findOne({ where: { slug } });
  }

  async findBySlug(slug: string) {
    const tenant = await this.tenantRepository.findOne({ where: { slug } });
    if (!tenant) throw new NotFoundException(`La tienda "${slug}" no existe`);
    
    if (!tenant.isActive) {
      this.logger.warn(`Intento de acceso a tienda bloqueada: ${slug}`);
      throw new NotFoundException(`La tienda "${slug}" no está disponible temporalmente.`);
    }
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.findOne(id);
    Object.assign(tenant, dto);
    const updated = await this.tenantRepository.save(tenant);
    
    // 👇 CORRECCIÓN: LogLevel.INFO
    this.logger.audit('TENANT_UPDATE', `Tienda actualizada: ${tenant.slug}`, LogLevel.INFO);
    return updated;
  }

  async remove(id: string) {
    const tenant = await this.findOne(id);
    await this.tenantRepository.remove(tenant);
    
    // 👇 CORRECCIÓN: LogLevel.WARN
    this.logger.audit('TENANT_DELETE', `Tienda eliminada: ${tenant.slug}`, LogLevel.WARN);
    return { success: true };
  }

  async findAll() {
    return this.tenantRepository.find();
  }
}