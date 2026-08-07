import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { APP_ROLES, canonicalizeRoleName } from '../auth/roles.constants';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly repo: Repository<Role>,
  ) {}

  findAll(): Promise<Role[]> {
    return this.repo.find();
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.repo.findOneBy({ id });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const nombre = this.normalizeRoleName(dto.nombre);
    if (!nombre) throw new BadRequestException('Role name is required');

    const existing = await this.repo.findOneBy({ nombre });
    if (existing) return existing;

    const role = this.repo.create({ ...dto, nombre });
    return this.repo.save(role);
  }

  async update(id: number, dto: UpdateRoleDto): Promise<Role> {
    const next = { ...dto };
    if (next.nombre !== undefined) {
      next.nombre = this.normalizeRoleName(next.nombre);
      if (!next.nombre) throw new BadRequestException('Role name is required');
    }

    await this.repo.update(id, next as any);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);
    if (canonicalizeRoleName(role.nombre) === APP_ROLES.ADMIN) {
      throw new BadRequestException('Admin role cannot be deleted');
    }

    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Role ${id} not found`);
  }

  private normalizeRoleName(nombre: unknown): string {
    if (typeof nombre !== 'string') return '';
    return canonicalizeRoleName(nombre);
  }
}
