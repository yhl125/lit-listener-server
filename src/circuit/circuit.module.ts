import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CircuitService } from './circuit.service';
import { CircuitController } from './circuit.controller';
import { Circuit, CircuitSchema } from './schemas/circuit.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Circuit.name, schema: CircuitSchema }]),
  ],
  controllers: [CircuitController],
  providers: [CircuitService],
  exports: [CircuitService],
})
export class CircuitModule {}
