import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { LoggerService } from '../../core/logger/logger.service';
import { LogLevel } from '../../core/logger/enums/log-level.enum'; // 👈 IMPORTANTE

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    
    // 👇 NUEVO: Inyectamos el repositorio de usuarios para poder actualizarlos
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateTenantDto, owner: User) {
    
    // --- 🛡️ 1. VALIDACIÓN DE LÍMITES (FREE TIER) ---
    // Definimos límites simples (esto podría venir de variables de entorno)
    const LIMITS = { FREE: 1, PRO: 5, ENTERPRISE: 999 };
    
    // Contamos cuántas tiendas tiene ya este usuario
    const currentStoresCount = await this.tenantRepository.count({ 
        where: { owner: { id: owner.id } } 
    });

    // Asumimos FREE si no tiene plan definido en el usuario (ajustar según tu modelo)
    const userPlan = (owner as any).plan || 'FREE'; 
    const maxAllowed = LIMITS[userPlan] || LIMITS.FREE;

    if (currentStoresCount >= maxAllowed) {
      this.logger.warn(`Usuario ${owner.email} intentó exceder límite de tiendas (${currentStoresCount}/${maxAllowed})`);
      throw new ForbiddenException(
        `Has alcanzado el límite de tiendas de tu plan ${userPlan} (${currentStoresCount}/${maxAllowed}).`
      );
    }
    // ------------------------------------------------

    // Generación de Slug
    if (!dto.slug) {
        dto.slug = dto.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }

    // Validar que el slug no exista (para evitar error 500 de SQL)
    const existingSlug = await this.findOneBySlug(dto.slug);
    if (existingSlug) {
        throw new ForbiddenException(`La URL "${dto.slug}" ya está en uso por otra tienda.`);
    }

    // Crear y guardar la tienda
    const tenant = this.tenantRepository.create({ ...dto, owner });
    const savedTenant = await this.tenantRepository.save(tenant);
    
    // --- ✨ 2. ASCENSO AUTOMÁTICO (USER -> OWNER) ---
    // Si el usuario era un simple "USER" y crea su tienda, lo ascendemos
    if (owner.role === UserRole.USER) {
        owner.role = UserRole.OWNER;
        owner.tenant = savedTenant; // Asignamos esta tienda como su contexto principal
        
        await this.userRepository.save(owner);
        this.logger.log(`🆙 Usuario ${owner.email} ascendido a OWNER tras crear su primera tienda.`);
    }
    // ------------------------------------------------

    this.logger.audit('TENANT_CREATE', `Nueva tienda creada: ${savedTenant.name} (${savedTenant.slug})`, LogLevel.INFO);
    return savedTenant;
  }

  async findOne(id: string) {
    const tenant = await this.tenantRepository.findOne({ 
        where: { id },
        relations: ['owner'] 
    });
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
    
    this.logger.audit('TENANT_UPDATE', `Tienda actualizada: ${tenant.slug}`, LogLevel.INFO);
    return updated;
  }

  async updateStatus(id: string, isActive: boolean) {
    const tenant = await this.findOne(id);
    tenant.isActive = isActive;
    const updated = await this.tenantRepository.save(tenant);

    const action = isActive ? 'TENANT_ACTIVATE' : 'TENANT_SUSPEND';
    const level = isActive ? LogLevel.INFO : LogLevel.WARN;
    
    this.logger.audit(action, `Estado de tienda ${tenant.slug} cambiado a: ${isActive}`, level);
    return updated;
  }

  async remove(id: string) {
    const tenant = await this.findOne(id);
    await this.tenantRepository.remove(tenant);
    
    this.logger.audit('TENANT_DELETE', `Tienda eliminada: ${tenant.slug}`, LogLevel.WARN);
    return { success: true };
  }

  async findAll() {
    return this.tenantRepository.find({
        relations: ['owner'], 
        order: { createdAt: 'DESC' }
    });
  }
}