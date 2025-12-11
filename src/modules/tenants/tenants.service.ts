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

  // =================================================================
  // 👇 NUEVO MÉTODO (SUAVE): Para validaciones internas como el Registro
  // =================================================================
  /**
   * Busca un tenant por slug pero NO lanza error si no existe.
   * Retorna null si está libre.
   */
  async findOneBySlug(slug: string) {
    return this.tenantRepository.findOne({ where: { slug } });
  }

  // =================================================================
  // 👇 MÉTODO EXISTENTE (ESTRICTO): Para la Vitrina Pública
  // =================================================================
  /**
   * Buscar tenant por su slug (para URLs tipo /:slug)
   * Lanza error si no existe o si está INACTIVO (Kill Switch).
   */
  async findBySlug(slug: string) {
    const tenant = await this.tenantRepository.findOne({ where: { slug } });

    if (!tenant) {
      throw new NotFoundException(`La tienda "${slug}" no existe`);
    }

    // Validación de Kill Switch (Tienda desactivada)
    if (!tenant.isActive) {
      // Lanzamos 404 para que parezca que la tienda desapareció
      throw new NotFoundException(`La tienda "${slug}" no está disponible temporalmente.`);
    }

    return tenant;
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
