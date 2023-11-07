import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CircuitService } from './circuit.service';
import { CreateCircuitDto } from './dto/create-circuit.dto';
import { UpdateCircuitDto } from './dto/update-circuit.dto';

@Controller('circuit')
export class CircuitController {
  constructor(private readonly circuitService: CircuitService) {}

  @Post()
  create(@Body() createCircuitDto: CreateCircuitDto) {
    return this.circuitService.create(createCircuitDto);
  }

  @Get()
  findAll() {
    return this.circuitService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.circuitService.findById(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.circuitService.remove(id);
  }
}
