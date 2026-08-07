import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './role.entity';
import { RoleSyncService } from './role-sync.service';

@Controller('roles')
export class RoleController {
  constructor(
    private readonly service: RoleService,
    private readonly roleSync: RoleSyncService,
  ) {}

  @Get()
  getAll(): Promise<Role[]> {
    return this.service.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string): Promise<Role> {
    return this.service.findOne(+id);
  }

  @Post()
  async create(@Body() dto: CreateRoleDto): Promise<Role> {
    const role = await this.service.create(dto);
    await this.roleSync.syncRoleName(role.nombre);
    return role;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<Role> {
    const role = await this.service.update(+id, dto);
    if (dto.nombre !== undefined) {
      await this.roleSync.syncRoleName(role.nombre);
    }
    return role;
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(+id);
  }
}
