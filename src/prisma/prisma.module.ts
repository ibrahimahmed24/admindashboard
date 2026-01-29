import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Optional: يجعل PrismaService متاح في كل المشروع بدون استيراد في كل Module
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
