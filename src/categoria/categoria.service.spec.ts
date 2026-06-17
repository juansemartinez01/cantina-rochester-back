import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import { Categoria } from './categoria.entity';
import { CategoriaService } from './categoria.service';
import { Producto } from '../producto/producto.entity';

describe('CategoriaService', () => {
  let service: CategoriaService;
  let categoriaRepo: {
    create: jest.Mock;
    delete: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneBy: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let productoRepo: {
    count: jest.Mock;
  };

  beforeEach(async () => {
    categoriaRepo = {
      create: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    productoRepo = {
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriaService,
        {
          provide: getRepositoryToken(Categoria),
          useValue: categoriaRepo,
        },
        {
          provide: getRepositoryToken(Producto),
          useValue: productoRepo,
        },
      ],
    }).compile();

    service = module.get<CategoriaService>(CategoriaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('devuelve categorias con orden estable por nombre e id', async () => {
      categoriaRepo.find.mockResolvedValue([]);

      await service.findAll();

      expect(categoriaRepo.find).toHaveBeenCalledWith({
        order: {
          nombre: 'ASC',
          id: 'ASC',
        },
      });
    });
  });

  describe('create', () => {
    it('rechaza nombres duplicados antes de guardar', async () => {
      categoriaRepo.findOne.mockResolvedValue({ id: 1, nombre: 'Bebidas' });

      await expect(
        service.create({ nombre: 'Bebidas' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(categoriaRepo.save).not.toHaveBeenCalled();
    });

    it('traduce una restriccion unique de base de datos a conflicto', async () => {
      categoriaRepo.findOne.mockResolvedValue(null);
      categoriaRepo.create.mockReturnValue({ nombre: 'Bebidas' });
      categoriaRepo.save.mockRejectedValue(createQueryFailedError('23505'));

      await expect(
        service.create({ nombre: 'Bebidas' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('update', () => {
    it('rechaza renombrar una categoria con un nombre ya usado', async () => {
      categoriaRepo.findOneBy.mockResolvedValue({ id: 1, nombre: 'Lacteos' });
      categoriaRepo.findOne.mockResolvedValue({ id: 2, nombre: 'Bebidas' });

      await expect(
        service.update(1, { nombre: 'Bebidas' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(categoriaRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('rechaza eliminar una categoria con productos asociados', async () => {
      productoRepo.count.mockResolvedValue(2);

      await expect(service.remove(1)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(productoRepo.count).toHaveBeenCalledWith({
        where: { categoria_id: 1 },
      });
      expect(categoriaRepo.delete).not.toHaveBeenCalled();
    });

    it('elimina la categoria cuando no tiene productos asociados', async () => {
      productoRepo.count.mockResolvedValue(0);
      categoriaRepo.delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(categoriaRepo.delete).toHaveBeenCalledWith(1);
    });

    it('devuelve 404 cuando la categoria no existe', async () => {
      productoRepo.count.mockResolvedValue(0);
      categoriaRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('traduce una restriccion FK de base de datos a conflicto', async () => {
      productoRepo.count.mockResolvedValue(0);
      categoriaRepo.delete.mockRejectedValue(createQueryFailedError('23503'));

      await expect(service.remove(1)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});

function createQueryFailedError(code: string): QueryFailedError {
  const error = Object.assign(new Error('query failed'), {
    name: 'QueryFailedError',
    driverError: { code },
  });
  Object.setPrototypeOf(error, QueryFailedError.prototype);
  return error as unknown as QueryFailedError;
}
