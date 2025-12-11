// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Configs
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';

// Core
import { CoreModule } from './core/core.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { StorefrontModule } from './modules/storefront/storefront.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PlatformModule } from './modules/platform/platform.module';

@Module({
  imports: [
    /**
     * Global config for the entire app
     */
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig], // <── IMPORTANTE
      envFilePath: '.env',
    }),

    /**
     * Database (TypeORM)
     */
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

    /**
     * Core system (request context, logger)
     */
    CoreModule,

    /**
     * Business modules
     */
    AuthModule,
    UsersModule,
    TenantsModule,
    ProductsModule,
    CategoriesModule,
    InventoryModule,
    StorefrontModule,
    UploadsModule,
    OrdersModule,
    PlatformModule,
  ],
})
export class AppModule {}
