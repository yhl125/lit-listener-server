import { Controller, Post, Body, Patch, Param } from '@nestjs/common';
import { CircuitZeroDevService } from './circuit-zerodev.service';
import { CreateCircuitZeroDevDto } from './dto/create-circuit-zerodev.dto';
import { SessionSigsDto } from 'src/circuit/dto/session-sigs.dto';
import { ValidateCircuitDto } from 'src/circuit/dto/validate-circuit.dto';

@Controller('circuit-zerodev')
export class CircuitZeroDevController {
  constructor(private readonly circuitZeroDevService: CircuitZeroDevService) {}

  @Post()
  create(@Body() createCircuitZeroDevDto: CreateCircuitZeroDevDto) {
    return this.circuitZeroDevService.create(createCircuitZeroDevDto);
  }

  @Patch('session-sigs/:id')
  updateSessionSigs(
    @Param('id') id: string,
    @Body() sessionSigs: SessionSigsDto,
  ) {
    return this.circuitZeroDevService.updateSessionSigs(id, sessionSigs);
  }

  @Patch('session-sigs/pkp-pub-key/:key')
  updateSessionSigsByPkpPubKey(
    @Param('key') key: string,
    @Body() sessionSigs: SessionSigsDto,
  ) {
    return this.circuitZeroDevService.updateSessionSigsByPkpPubKey(
      key,
      sessionSigs,
    );
  }

  @Post('reactivate-server-down-circuit/:id')
  reactivateServerDownCircuit(
    @Param('id') id: string,
    @Body() body: ValidateCircuitDto,
  ) {
    return this.circuitZeroDevService.reactivateServerDownCircuit(id, body);
  }

  @Post('stop/:id')
  stop(@Param('id') id: string, @Body() body: ValidateCircuitDto) {
    return this.circuitZeroDevService.stop(id, body);
  }
}
