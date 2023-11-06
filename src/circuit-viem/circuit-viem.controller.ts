import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CircuitViemService } from './circuit-viem.service';
import { CreateCircuitViemDto } from './dto/create-circuit-viem.dto';
import { UpdateCircuitViemDto } from './dto/update-circuit-viem.dto';

@Controller('circuit-viem')
export class CircuitViemController {
  constructor(private readonly circuitViemService: CircuitViemService) {}

  @Post()
  create(@Body() createCircuitViemDto: CreateCircuitViemDto) {
    return this.circuitViemService.create(createCircuitViemDto);
  }

  // @Get()
  // findAll() {
  //   return this.circuitViemService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.circuitViemService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateCircuitViemDto: UpdateCircuitViemDto) {
  //   return this.circuitViemService.update(+id, updateCircuitViemDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.circuitViemService.remove(+id);
  // }
}
