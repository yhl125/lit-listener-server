import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateCircuitDto } from './dto/create-circuit.dto';
import { UpdateCircuitDto } from './dto/update-circuit.dto';
import { Circuit } from './schemas/circuit.schema';
import {
  ICheckWhenConditionMetLog,
  ICircuitLog,
  IConditionLog,
  ITransactionLog,
  IUserOperationLog,
} from '@lit-listener-sdk/types';
import { ObjectId } from 'bson';

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

  async addCircuitLog(id: ObjectId, log: ICircuitLog) {
    await this.circuitModel.updateOne(
      { _id: id },
      { $push: { circuitLogs: log } },
    );
  }

  async addConditionLog(id: ObjectId, log: IConditionLog) {
    await this.circuitModel.updateOne(
      { _id: id },
      { $push: { conditionLogs: log } },
    );
  }

  async addCheckWhenConditionMetLog(
    id: ObjectId,
    log: ICheckWhenConditionMetLog,
  ) {
    await this.circuitModel.updateOne(
      { _id: id },
      { $push: { checkWhenConditionMetLogs: log } },
    );
  }

  async addTransactionLog(id: ObjectId, log: ITransactionLog) {
    await this.circuitModel.updateOne(
      { _id: id },
      { $push: { transactionLogs: log } },
    );
  }

  async addUserOperationLog(id: ObjectId, log: IUserOperationLog) {
    await this.circuitModel.updateOne(
      { _id: id },
      { $push: { userOperationLogs: log } },
    );
  }

  async updateStatus(
    id: ObjectId,
    status: 'running' | 'stopped' | 'server down while running',
  ) {
    return await this.circuitModel.updateOne({ _id: id }, { $set: { status } });
  }

  update(id: number, updateCircuitDto: UpdateCircuitDto) {
    return `This action updates a #${id} circuit`;
  }

  remove(id: string) {
    return this.circuitModel.findByIdAndRemove(id);
  }
}
