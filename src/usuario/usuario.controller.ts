import { Controller, Get, Post, Put, Delete, Param, Body, Patch, Query } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Usuario } from './usuario.entity';
import { Public } from '../auth/isPublic';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly service: UsuarioService) {}

  @Get()
  getAll(@Query('activo') activo?: 'true' | 'false' | 'all'): Promise<Usuario[]> {
    return this.service.findAll(activo);
  }

  @Get(':id')
  getOne(@Param('id') id: string): Promise<Usuario> {
    return this.service.findOne(+id);
  }

  @Public()
  @Post()
  create(@Body() dto: CreateUsuarioDto): Promise<Usuario> {
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUsuarioDto,
  ): Promise<Usuario> {
    return this.service.update(+id, dto);
  }

  @Patch(':id/desactivar')
  desactivar(@Param('id') id: string): Promise<Usuario> {
    return this.service.desactivar(+id);
  }

  @Patch(':id/activar')
  activar(@Param('id') id: string): Promise<Usuario> {
    return this.service.activar(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Usuario> {
    return this.service.remove(+id);
  }
}


