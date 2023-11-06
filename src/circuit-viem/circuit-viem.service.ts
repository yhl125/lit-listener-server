import { Injectable } from '@nestjs/common';
import { CircuitViem } from '@lit-listener-sdk/circuit-viem';
import { CreateCircuitViemDto } from './dto/create-circuit-viem.dto';
import { UpdateCircuitViemDto } from './dto/update-circuit-viem.dto';

@Injectable()
export class CircuitViemService {
  create(createCircuitViemDto: CreateCircuitViemDto) {
    const circuit = new CircuitViem(createCircuitViemDto);
    circuit.start();

    return 'circuitViem created';
  }

  findAll() {
    return `This action returns all circuitViem`;
  }

  findOne(id: number) {
    return `This action returns a #${id} circuitViem`;
  }

  update(id: number, updateCircuitViemDto: UpdateCircuitViemDto) {
    return `This action updates a #${id} circuitViem`;
  }

  remove(id: number) {
    return `This action removes a #${id} circuitViem`;
  }
}
