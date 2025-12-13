import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { LoggerModule } from 'src/core/logger/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Repositorio de User
    LoggerModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule], 
})
export class UsersModule {}
