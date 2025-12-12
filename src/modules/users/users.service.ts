import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum'; // 👈 Importar Enum
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoggerService } from '../../core/logger/logger.service';
import { LogLevel } from 'src/core/logger/enums/log-level.enum'; // 👈 Importar LogLevel

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateUserDto, tenantId?: string, role: UserRole = UserRole.STAFF): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      ...dto,
      password: hashedPassword,
      tenantId: tenantId ?? undefined,
      role,
    });

    const savedUser = await this.userRepo.save(user);

    if (tenantId) {
      // 👇 CORRECCIÓN: Usar LogLevel.INFO
      this.logger.audit('USER_CREATE', `Nuevo usuario creado: ${savedUser.email}`, LogLevel.INFO);
    }

    return savedUser;
  }

  async save(user: User): Promise<User> {
    return this.userRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email },
      relations: ['tenant'],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['tenant'],
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findAllByTenant(tenantId: string): Promise<User[]> {
    return this.userRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneByTenant(id: string, tenantId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Usuario no encontrado en esta tienda');
    return user;
  }

  async updateByTenant(id: string, dto: UpdateUserDto, tenantId: string) {
    const user = await this.findOneByTenant(id, tenantId);

    // 👇 Ahora 'role' existe en dto gracias a PartialType
    if (user.role === UserRole.OWNER && dto.role && dto.role !== UserRole.OWNER) {
      throw new ForbiddenException('No puedes degradar al dueño de la tienda');
    }

    // 👇 Ahora 'password' existe en dto
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
      // 👇 CORRECCIÓN: Usar LogLevel.INFO
      this.logger.audit('USER_PASSWORD_CHANGE', `Password cambiado para: ${user.email}`, LogLevel.INFO);
    }

    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async removeByTenant(id: string, tenantId: string) {
    const user = await this.findOneByTenant(id, tenantId);
    if (user.role === UserRole.OWNER) throw new ForbiddenException('No puedes eliminar al dueño');
    
    await this.userRepo.remove(user);
    // 👇 CORRECCIÓN: Usar LogLevel.WARN
    this.logger.audit('USER_DELETE', `Usuario eliminado: ${user.email}`, LogLevel.WARN);
    
    return { success: true };
  }
}