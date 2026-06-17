import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, QueryFailedError, Repository } from 'typeorm';
import { Producto } from '../producto/producto.entity';
import { Categoria } from './categoria.entity';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriaService {
  constructor(
    @InjectRepository(Categoria)
    private readonly repo: Repository<Categoria>,
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
  ) {}

  findAll(): Promise<Categoria[]> {
    return this.repo.find({
      order: {
        nombre: 'ASC',
        id: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<Categoria> {
    const cat = await this.repo.findOneBy({ id });
    if (!cat) throw new NotFoundException(`Categoria ${id} no encontrada`);
    return cat;
  }

  async create(dto: CreateCategoriaDto): Promise<Categoria> {
    await this.assertNombreDisponible(dto.nombre);
    const cat = this.repo.create(dto);

    try {
      return await this.repo.save(cat);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw this.nombreDuplicado(dto.nombre);
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateCategoriaDto): Promise<Categoria> {
    await this.findOne(id);

    if (dto.nombre !== undefined) {
      await this.assertNombreDisponible(dto.nombre, id);
    }

    try {
      await this.repo.update(id, dto);
    } catch (error) {
      if (this.isUniqueViolation(error) && dto.nombre !== undefined) {
        throw this.nombreDuplicado(dto.nombre);
      }
      throw error;
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const productosAsociados = await this.productoRepo.count({
      where: { categoria_id: id },
    });

    if (productosAsociados > 0) {
      throw new ConflictException(
        `No se puede eliminar la categoria ${id} porque tiene productos asociados`,
      );
    }

    let res;
    try {
      res = await this.repo.delete(id);
    } catch (error) {
      if (this.isForeignKeyViolation(error)) {
        throw new ConflictException(
          `No se puede eliminar la categoria ${id} porque tiene productos asociados`,
        );
      }
      throw error;
    }

    if (res.affected === 0)
      throw new NotFoundException(`Categoria ${id} no encontrada`);
  }

  private isForeignKeyViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as QueryFailedError & { driverError?: { code?: string } })
        .driverError?.code === '23503'
    );
  }

  private async assertNombreDisponible(
    nombre: string,
    excludeId?: number,
  ): Promise<void> {
    const existente = await this.repo.findOne({
      where: {
        nombre,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
    });

    if (existente) {
      throw this.nombreDuplicado(nombre);
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as QueryFailedError & { driverError?: { code?: string } })
        .driverError?.code === '23505'
    );
  }

  private nombreDuplicado(nombre: string): ConflictException {
    return new ConflictException(
      `Ya existe una categoria con el nombre "${nombre}"`,
    );
  }
}
