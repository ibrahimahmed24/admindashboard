import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Prisma 7+ بيحتاج تستخدم constructor مع config
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'], // optional
    });
  }

  async onModuleInit() {
    await this.$connect(); // دلوقتي مفروض يشتغل مع PrismaClient
    console.log('✅ Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🛑 Prisma disconnected from database');
  }
}
