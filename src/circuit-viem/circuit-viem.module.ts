import { Module } from '@nestjs/common';
import { CircuitViemService } from './circuit-viem.service';
import { CircuitViemController } from './circuit-viem.controller';
import { CircuitModule } from 'src/circuit/circuit.module';

@Module({
  imports: [CircuitModule],
  controllers: [CircuitViemController],
  providers: [CircuitViemService],
})
export class CircuitViemModule {}
