// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Guard global de bloqueo de IPs
import { APP_GUARD } from '@nestjs/core';
import { IpBlockGuard } from './core/guards/ip-block/ip-block.guard';

// Scheduling
import { ScheduleModule } from '@nestjs/schedule';

// Mailer
import { MailerModule } from '@nestjs-modules/mailer';

// Configs
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';

// Core
import { CoreModule } from './core/core.module';

// =========================================================
// 🏗️ DOMAIN MODULES (Nueva Arquitectura)
// =========================================================

// 1. IAM (Identity & Access Management)
import { AuthModule } from './modules/iam/auth/auth.module';
import { UsersModule } from './modules/iam/users/users.module';

// 2. SaaS (Platform Management)
import { TenantsModule } from './modules/saas/tenants/tenants.module';
import { PlatformModule } from './modules/saas/platform/platform.module';
import { SecurityModule } from './modules/saas/security/security.module';

// 3. COMMERCE (Store Engine)
import { ProductsModule } from './modules/commerce/products/products.module';
import { CategoriesModule } from './modules/commerce/categories/categories.module';
import { InventoryModule } from './modules/commerce/inventory/inventory.module';
import { OrdersModule } from './modules/commerce/orders/orders.module';
import { StorefrontModule } from './modules/commerce/storefront/storefront.module';

// 4. SHARED (Common Utilities)
import { UploadsModule } from './modules/shared/uploads/uploads.module';

@Module({
  imports: [
    // --- INFRASTRUCTURE ---
    ScheduleModule.forRoot(),
    
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig],
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [databaseConfig.KEY],
      useFactory: (dbConfig: any) => ({
        type: 'postgres',
        host: dbConfig.host,
        port: dbConfig.port,
        username: dbConfig.username,
        password: dbConfig.password,
        database: dbConfig.database,
        autoLoadEntities: true,
        synchronize: dbConfig.synchronize,
        logging: dbConfig.logging,
      }),
    }),

    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'ozkrgonzalez1201@gmail.com', 
          pass: 'krzr erlt qgmf aaif',      
        },
      },
      defaults: {
        from: '"SimpleShop Security" <no-reply@simpleshop.com>',
      },
    }),

    // --- CORE SYSTEM ---
    CoreModule,

    // --- FEATURE MODULES (Organized) ---
    
    // IAM
    AuthModule,
    UsersModule,

    // SaaS
    TenantsModule,
    PlatformModule,
    SecurityModule,

    // Commerce
    ProductsModule,
    CategoriesModule,
    InventoryModule,
    OrdersModule,
    StorefrontModule,

    // Shared
    UploadsModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: IpBlockGuard,
    },
  ],
})
export class AppModule {}