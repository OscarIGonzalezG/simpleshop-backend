import { Body, Controller, Post, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard'; // 👈 Asegúrate de la ruta
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ===========================
  //         REGISTER
  // ===========================
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ===========================
  //          LOGIN
  // ===========================
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ===========================
  //       VERIFY ACCOUNT
  // ===========================
  @Post('verify')
  verifyAccount(@Body() dto: { email: string, code: string }) {
    return this.authService.verifyEmail(dto);
  }

  // ===========================
  //      RESEND CODE
  // ===========================
  @Post('resend')
  @HttpCode(HttpStatus.OK)
  async resendCode(@Body() body: { email: string }) {
    return this.authService.resendCode(body.email);
  }

  // 👇 NUEVO: ENDPOINT DE IMPERSONATION (MODO FANTASMA)
  // Protegido: Solo un Super Admin logueado puede usar esto.
  @UseGuards(JwtAuthGuard) 
  @Roles(UserRole.SUPER_ADMIN)
  @Post('impersonate/:userId')
  async impersonate(@Param('userId') userId: string) {
    return this.authService.impersonate(userId);
  }
}