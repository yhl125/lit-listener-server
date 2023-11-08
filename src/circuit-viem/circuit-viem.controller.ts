import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CircuitViemService } from './circuit-viem.service';
import { CreateCircuitViemDto } from './dto/create-circuit-viem.dto';
import { ValidateCircuitDto } from 'src/circuit/dto/validate-circuit.dto';
import { SessionSigsDto } from 'src/circuit/dto/session-sigs.dto';

@Controller('circuit-viem')
export class CircuitViemController {
  constructor(private readonly circuitViemService: CircuitViemService) {}

  @Post()
  create(@Body() createCircuitViemDto: CreateCircuitViemDto) {
    return this.circuitViemService.create(createCircuitViemDto);
  }

  @Patch('session-sigs/:id')
  updateSessionSigs(
    @Param('id') id: string,
    @Body() sessionSigs: SessionSigsDto,
  ) {
    return this.circuitViemService.updateSessionSigs(id, sessionSigs);
  }

  @Patch('session-sigs/pkp-pub-key/:key')
  updateSessionSigsByPkpPubKey(
    @Param('key') key: string,
    @Body() sessionSigs: SessionSigsDto,
  ) {
    return this.circuitViemService.updateSessionSigsByPkpPubKey(
      key,
      sessionSigs,
    );
  }

  @Post('stop/:id')
  stop(@Param('id') id: string, @Body() body: ValidateCircuitDto) {
    return this.circuitViemService.stop(id, body);
  }
}
