import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // =====================================
  //            CREATE USER
  // =====================================
  async create(
    dto: CreateUserDto,
    tenantId?: string,   // <── no null, opcional
    role: UserRole = UserRole.STAFF,
  ): Promise<User> {
    const hashed = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      ...dto,
      password: hashed,
      tenantId: tenantId ?? undefined, // <── nunca null
      role,
    });

    return await this.userRepo.save(user);
  }

  // =====================================
  //            FIND HELPERS
  // =====================================

  async save(user: User): Promise<User> {
    return this.userRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email },
      relations: ['tenant'],
    });
  }

  // Uso interno (Auth) - Busca globalmente por ID
  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['tenant'],
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    return user;
  }

  // =====================================
  //      TENANT SCOPED METHODS (SaaS)
  // =====================================
  async findAllByTenant(tenantId: string): Promise<User[]> {
    return this.userRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

async findOneByTenant(id: string, tenantId: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id, tenantId }, // 🔒 Filtro doble: ID + Tenant
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado en esta tienda');
    }

    return user;
  }

  async updateByTenant(id: string, dto: UpdateUserDto, tenantId: string) {
    const user = await this.findOneByTenant(id, tenantId);

    // Seguridad: No permitir cambiar el rol del OWNER principal
    if (user.role === UserRole.OWNER && dto.role && dto.role !== UserRole.OWNER) {
      throw new ForbiddenException('No puedes degradar al dueño de la tienda');
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async removeByTenant(id: string, tenantId: string) {
    const user = await this.findOneByTenant(id, tenantId);

    if (user.role === UserRole.OWNER) {
      throw new ForbiddenException('No puedes eliminar al dueño de la tienda');
    }

    return this.userRepo.remove(user);
  }
}
