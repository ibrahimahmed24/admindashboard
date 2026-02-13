import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AdminsModule } from './admins/admins.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [AuthModule, AdminsModule, RolesModule, PermissionsModule, PrismaModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
