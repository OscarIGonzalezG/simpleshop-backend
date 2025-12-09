import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Crear un Tenant (normalmente llamado desde AuthService)
   */
  async create(dto: CreateTenantDto, owner: User) {
    const tenant = this.tenantRepository.create({
      ...dto,
      owner,
    });

    return this.tenantRepository.save(tenant);
  }

  /**
   * Buscar un tenant por ID
   */
  async findOne(id: string) {
    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    return tenant;
  }

  /**
   * Buscar tenant por email
   */
  async findByEmail(email: string) {
    return this.tenantRepository.findOne({ where: { email } });
  }

  /**
   * Buscar tenant por su slug (para URLs tipo /:slug)
   */
  async findBySlug(slug: string) {
    return this.tenantRepository.findOne({ where: { slug } });
  }

  /**
   * Actualizar tenant
   */
  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.findOne(id);

    Object.assign(tenant, dto);

    return this.tenantRepository.save(tenant);
  }

  /**
   * Eliminar tenant completamente
   */
  async remove(id: string) {
    const tenant = await this.findOne(id);

    return this.tenantRepository.remove(tenant);
  }

  /**
   * Listar todos los tenants
   */
  async findAll() {
    return this.tenantRepository.find();
  }
}
