import { BadGatewayException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { CreateAdminDto } from "./dto/create-admin.dto";
import * as bcrypt from 'bcrypt';
import { Admin } from "@prisma/client"; 
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminsService {
  private readonly logger = new Logger(AdminsService.name);

  constructor(private readonly prisma: PrismaService) {}

  //CREATE
  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    try {
      const { email, password, name, isSuperAdmin } = createAdminDto;

      this.logger.log(`Creating admin with email: ${email}`);

      const existing = await this.prisma.admin.findUnique({
        where: { email },
      });

      if (existing) {
        throw new ConflictException('Admin with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newAdmin = await this.prisma.admin.create({
        data: {
          email,
          password: hashedPassword,
          name,
          isSuperAdmin: isSuperAdmin ?? false,
        },
      });

      this.logger.log(`Admin created with ID: ${newAdmin.id}`);
      return newAdmin;

    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to create admin: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new InternalServerErrorException('Failed to create admin');
    }
  }

  //  FIND
  async findAdmin(identifier: string, isEmail: boolean = false): Promise<Admin> {
    const admin = await this.prisma.admin.findUnique({
      where: isEmail ? { email: identifier } : { id: identifier },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    });

    if (!admin || admin.isDeleted) {
      throw new NotFoundException(`Admin not found`);
    }

    return admin;
  }

  async findById(id: string): Promise<Admin> {
    return this.findAdmin(id, false);
  }

  async findByEmail(email: string): Promise<Admin> {
    return this.findAdmin(email, true);
  }


  //  UPDATE
  async updateLastLogin(id: string): Promise<Admin> {
    try {
      const admin = await this.prisma.admin.findUnique({ where: { id } });
      if (!admin) {
        throw new NotFoundException('Admin not found');
      }
      const updatedAdmin = await this.prisma.admin.update({
        where: { id },
        data: {
          lastLoginAt: new Date(),
        },
      });
      this.logger.log(`Updated last login for admin ${id}`);
      return updatedAdmin;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update last login for admin ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new InternalServerErrorException('Failed to update last login');
    }
  }

  

  // ================= DELETE =================
  async softDelete(id: string): Promise<Admin> {
    try {
      const admin = await this.prisma.admin.findUnique({ where: { id } });
      if (!admin) {
        throw new NotFoundException('Admin not found');
      }
      if (admin.isDeleted) {
        throw new BadGatewayException('Admin is already deleted');
      }
      const deletedAdmin = await this.prisma.admin.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
        },
      });
      this.logger.log(`Soft deleted admin ${id}`);
      return deletedAdmin;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadGatewayException) throw error;
      this.logger.error(`Failed to soft delete admin ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new InternalServerErrorException('Failed to soft delete admin');
    }
  }

  async restore(id: string): Promise<Admin> {
    try {
      const admin = await this.prisma.admin.findUnique({ where: { id } });
      if (!admin) {
        throw new NotFoundException('Admin not found');
      }
      if (!admin.isDeleted) {
        throw new BadGatewayException('Admin is not deleted');
      }
      const restoredAdmin = await this.prisma.admin.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
      });
      this.logger.log(`Restored admin ${id}`);
      return restoredAdmin;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadGatewayException) throw error;
      this.logger.error(`Failed to restore admin ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new InternalServerErrorException('Failed to restore admin');
    }
  }

  async hardDelete(id: string): Promise<Admin> {
    try {
      const admin = await this.prisma.admin.findUnique({ where: { id } });
      if (!admin) {
        throw new NotFoundException('Admin not found');
      }
      const deletedAdmin = await this.prisma.admin.delete({
        where: { id },
      });
      this.logger.log(`Hard deleted admin ${id}`);
      return deletedAdmin;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to hard delete admin ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new InternalServerErrorException('Failed to delete admin');
    }
  }
   

  // ================= LIST =================
  async getAllAdmins(skip: number = 0, take: number = 10): Promise<{ data: Admin[]; total: number }> {
    const [admins, total] = await Promise.all([
      this.prisma.admin.findMany({
        where: { isDeleted: false },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.admin.count({ where: { isDeleted: false } }),
    ]);

    if (!admins.length) {
      throw new NotFoundException('No admins found');
    }

    return { data: admins, total };
  }

  // ================= TOKENS =================
  async saveRefreshToken(adminId: string, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 10);

    return this.prisma.admin.update({
      where: { id: adminId },
      data: { refreshToken: hashedToken },
       
    });
  }

  async removeRefreshToken(adminId: string) {
    return this.prisma.admin.update({
      where: { id: adminId },
      data: { refreshToken: null },
    });
  }

  async validateRefreshToken(adminId: string, refreshToken: string): Promise<boolean> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin || !admin.refreshToken) return false;

    return bcrypt.compare(refreshToken, admin.refreshToken);
  }

  async deactivate(adminId: string): Promise<Admin> {
    try {
      const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
      if (!admin) {
        throw new NotFoundException('Admin not found');
      }
      const updatedAdmin = await this.prisma.admin.update({
        where: { id: adminId },
        data: { isActive: false },
      });
      this.logger.log(`Deactivated admin ${adminId}`);
      return updatedAdmin;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to deactivate admin ${adminId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new InternalServerErrorException('Failed to deactivate admin');
    }
  }

  async activate(adminId: string): Promise<Admin> {
    try {
      const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
      if (!admin) {
        throw new NotFoundException('Admin not found');
      }
      const updatedAdmin = await this.prisma.admin.update({
        where: { id: adminId },
        data: { isActive: true },
      });
      this.logger.log(`Activated admin ${adminId}`);
      return updatedAdmin;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to activate admin ${adminId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new InternalServerErrorException('Failed to activate admin');
    }
  }
}