import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './role.entity';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { RoleSyncController } from './role-sync.controller';
import { RoleSyncService } from './role-sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  providers: [RoleService, RoleSyncService],
  controllers: [RoleController, RoleSyncController],
})
export class RoleModule {}
