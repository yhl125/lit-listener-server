import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateCircuitDto } from './dto/create-circuit.dto';
import { UpdateCircuitDto } from './dto/update-circuit.dto';
import { Circuit } from './schemas/circuit.schema';

@Injectable()
export class CircuitService {
  constructor(
    @InjectModel(Circuit.name) private circuitModel: Model<Circuit>,
  ) {}

  create(createCircuitDto: CreateCircuitDto) {
    return this.circuitModel.create(createCircuitDto);
  }

  findAll() {
    return `This action returns all circuit`;
  }

  findById(id: string) {
    return this.circuitModel.findById(id);
  }

  update(id: number, updateCircuitDto: UpdateCircuitDto) {
    return `This action updates a #${id} circuit`;
  }

  remove(id: string) {
    return this.circuitModel.findByIdAndRemove(id);
  }
}
