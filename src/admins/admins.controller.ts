import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Patch, 
  Post, 
  Query
} from '@nestjs/common';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminStatusDto } from './dto/update-admin-status.dto';
import { Admin } from '@prisma/client';

@Controller('admins')
export class AdminController {
  constructor(private readonly adminsService: AdminsService) {}

  //  CREATE
  @Post()
  async createAdmin(@Body() createAdminDto: CreateAdminDto): Promise<Admin> {
    return this.adminsService.create(createAdminDto);
  }

  //  READ 
  @Get()
  async getAllAdmins(
    @Query('skip') skip?: string,
    @Query('take') take?: string
  ) {
    return this.adminsService.getAllAdmins(
      parseInt(skip || '0'),
      parseInt(take || '10')
    );
  }

  @Get(':id')
  async getAdminById(@Param('id') id: string): Promise<Admin> {
    return this.adminsService.findById(id);
  }

  @Get('by-email/:email')
  async getAdminByEmail(@Param('email') email: string): Promise<Admin> {
    return this.adminsService.findByEmail(email);
  } 
  @Patch(':id/last-login')
  async updateLastLogin(@Param('id') id: string): Promise<Admin> {
    return this.adminsService.updateLastLogin(id);
  }

   @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateAdminStatusDto: UpdateAdminStatusDto
  ): Promise<Admin> {
    const { isActive } = updateAdminStatusDto;
    if (isActive) {
      return this.adminsService.activate(id);
    } else {
      return this.adminsService.deactivate(id);
    }
  }


  //  DELETE
  @Patch(':id/soft-delete')
  async softDelete(@Param('id') id: string): Promise<Admin> {
    return this.adminsService.softDelete(id);
  }

  @Patch(':id/restore')
  async restore(@Param('id') id: string): Promise<Admin> {
    return this.adminsService.restore(id);
  }

  @Delete(':id')
  async hardDelete(@Param('id') id: string): Promise<Admin> {
    return this.adminsService.hardDelete(id);
  }
}
