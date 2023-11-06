import { Module } from '@nestjs/common';
import { CircuitViemService } from './circuit-viem.service';
import { CircuitViemController } from './circuit-viem.controller';

@Module({
  controllers: [CircuitViemController],
  providers: [CircuitViemService],
})
export class CircuitViemModule {}
