import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoggerService } from '../../core/logger/logger.service';
import { LogLevel } from 'src/core/logger/enums/log-level.enum';

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
      isActive: true, // Por defecto activo al crear
    });

    const savedUser = await this.userRepo.save(user);

    if (tenantId) {
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
      relations: ['tenant'], // Traer tenant es útil para el panel
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  // 👇 NUEVO: Listar todos (Global)
  async findAllGlobal(): Promise<User[]> {
    return this.userRepo.find({
        order: { createdAt: 'DESC' },
        relations: ['tenant'],
    });
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

    if (user.role === UserRole.OWNER && dto.role && dto.role !== UserRole.OWNER) {
      throw new ForbiddenException('No puedes degradar al dueño de la tienda');
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
      this.logger.audit('USER_PASSWORD_CHANGE', `Password cambiado para: ${user.email}`, LogLevel.INFO);
    }

    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async removeByTenant(id: string, tenantId: string) {
    const user = await this.findOneByTenant(id, tenantId);
    if (user.role === UserRole.OWNER) throw new ForbiddenException('No puedes eliminar al dueño');
    
    await this.userRepo.remove(user);
    this.logger.audit('USER_DELETE', `Usuario eliminado: ${user.email}`, LogLevel.WARN);
    
    return { success: true };
  }

  // 👇 LÓGICA KILL SWITCH
  async updateStatus(id: string, isActive: boolean) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Seguridad: No te puedes bloquear a ti mismo si eres Super Admin (opcional pero recomendado)
    if (user.role === UserRole.SUPER_ADMIN && !isActive) {
        // Podrías permitirlo, pero cuidado con quedarte fuera
    }

    user.isActive = isActive;
    const saved = await this.userRepo.save(user);
    
    // Auditamos el cambio
    const action = isActive ? 'USER_UNBLOCK' : 'USER_BLOCK';
    this.logger.audit(action, `Estado de usuario ${user.email} cambiado a: ${isActive}`, LogLevel.WARN);

    return saved;
  }

  // 👇 LÓGICA ADMIN RESET
  async adminResetPassword(id: string, newPass: string) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPass, salt);

    await this.userRepo.save(user);
    this.logger.audit('ADMIN_RESET_PASS', `Admin reseteó pass de: ${user.email}`, LogLevel.SECURITY);
    
    return { success: true };
  }
}