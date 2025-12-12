import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/modules/users/enums/user-role.enum';

export const ROLES_KEY = 'roles';

/**
 * Decorador para definir los roles requeridos en un handler.
 *
 * Ejemplo:
 *  @Roles('owner', 'admin')
 *  @Get('something')
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
