import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { StockActualService } from './stock-actual.service';
import { CreateStockActualDto } from './dto/create-stock-actual.dto';
import { UpdateStockActualDto } from './dto/update-stock-actual.dto';
import { StockActual } from './stock-actual.entity';
import { RegistrarInsumoDto } from './dto/registrar-insumo.dto';
import { CancelarInsumoDto } from './dto/cancelar-insumo.dto';
import { QueryStockActualDto } from './dto/query-stock-actual.dto';

@Controller('stock-actual')
export class StockActualController {
  constructor(private readonly service: StockActualService) {}

  // 🔹 GETs

  @Get()
  getAll(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    query: QueryStockActualDto,
  ) {
    return this.service.findAll(query);
  }

  @Get('almacen/:almacenId')
  getStockByAlmacen(
    @Param('almacenId', ParseIntPipe) almacenId: number,
  ): Promise<any> {
    return this.service.getStockByAlmacen(almacenId);
  }

  @Get(':productoId/:almacenId')
  getOne(
    @Param('productoId', ParseIntPipe) productoId: number,
    @Param('almacenId', ParseIntPipe) almacenId: number,
  ): Promise<StockActual> {
    return this.service.findOne(productoId, almacenId);
  }

  

  // 🔹 POSTs

  @Post('entrada')
  registrarEntrada(
    @Body() dto: CreateStockActualDto,
  ): Promise<StockActual> {
    return this.service.registrarEntrada(dto);
  }

  @Post('insumo')
  registrarInsumo(
    @Body() dto: RegistrarInsumoDto,
  ): Promise<StockActual> {
    return this.service.registrarInsumo(dto);
  }

  @Post('cancelar-insumo')
  cancelarInsumo(
    @Body() dto: CancelarInsumoDto,
  ): Promise<StockActual> {
    return this.service.cancelarInsumo(dto);
  }



  @Post()
  create(@Body() dto: CreateStockActualDto): Promise<StockActual> {
    return this.service.create(dto);
  }

  // 🔹 PUT

  @Put(':productoId/:almacenId')
  update(
    @Param('productoId', ParseIntPipe) productoId: number,
    @Param('almacenId', ParseIntPipe) almacenId: number,
    @Body() dto: UpdateStockActualDto,
  ): Promise<StockActual> {
    return this.service.update(productoId, almacenId, dto);
  }

  // 🔹 DELETE

  @Delete(':productoId/:almacenId')
  remove(
    @Param('productoId', ParseIntPipe) productoId: number,
    @Param('almacenId', ParseIntPipe) almacenId: number,
  ): Promise<void> {
    return this.service.remove(productoId, almacenId);
  }
}
