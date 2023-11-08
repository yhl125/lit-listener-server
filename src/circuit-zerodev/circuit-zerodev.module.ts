import { Module } from '@nestjs/common';
import { CircuitZeroDevService } from './circuit-zerodev.service';
import { CircuitZeroDevController } from './circuit-zerodev.controller';
import { CircuitModule } from 'src/circuit/circuit.module';

@Module({
  imports: [CircuitModule],
  controllers: [CircuitZeroDevController],
  providers: [CircuitZeroDevService],
})
export class CircuitZeroDevModule {}
