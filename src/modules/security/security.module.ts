import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import { BlockedIp } from './entities/blocked-ip.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([BlockedIp])],
  controllers: [SecurityController],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}