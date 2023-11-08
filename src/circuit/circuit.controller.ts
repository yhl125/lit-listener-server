import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CircuitService } from './circuit.service';
import { ValidateCircuitDto } from './dto/validate-circuit.dto';

@Controller('circuit')
export class CircuitController {
  constructor(private readonly circuitService: CircuitService) {}

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.circuitService.findById(id);
  }

  @Get('pkp-pub-key/:key')
  findByPkpPubKey(@Param('key') key: string) {
    return this.circuitService.findByPkpPubKey(key);
  }

  @Get('pkp-pub-key/:status/:key')
  findByPkpPubKeyWithStatus(
    @Param('status') status: string,
    @Param('key') key: string,
  ) {
    return this.circuitService.findByPkpPubKeyWithStatus(status, key);
  }

  @Get('pkp-pub-key/count/:key')
  countByPkpPubKey(@Param('key') key: string) {
    return this.circuitService.countByPkpPubKey(key);
  }

  @Get('pkp-pub-key/count/:status/:key')
  countByPkpPubKeyWithStatus(
    @Param('status') status: string,
    @Param('key') key: string,
  ) {
    return this.circuitService.countByPkpPubKeyWithStatus(status, key);
  }

  @Post('remove/:id')
  remove(@Param('id') id: string, @Body() body: ValidateCircuitDto) {
    return this.circuitService.remove(id, body);
  }
}
