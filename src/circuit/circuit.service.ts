import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateCircuitDto } from './dto/create-circuit.dto';
import { Circuit } from './schemas/circuit.schema';
import {
  ICheckWhenConditionMetLog,
  ICircuitLog,
  IConditionLog,
  ITransactionLog,
  IUserOperationLog,
  IViemContractCondition,
  IViemEventCondition,
  IWebhookCondition,
  ViemContractCondition,
  ViemEventCondition,
  WebhookCondition,
} from '@lit-listener-sdk/types';
import { ObjectId } from 'bson';
import { isEmpty, validateAuthSig, validateSessionSigs } from 'src/utils';
import { ValidateCircuitDto } from './dto/validate-circuit.dto';

@Injectable()
export class CircuitService {
  constructor(
    @InjectModel(Circuit.name) private circuitModel: Model<Circuit>,
  ) {}

  create(createCircuitDto: CreateCircuitDto) {
    return this.circuitModel.create(createCircuitDto);
  }

  findById(id: string) {
    return this.circuitModel.findById(id);
  }

  findByPkpPubKey(pkpPubKey: string) {
    return this.circuitModel.find({ pkpPubKey: pkpPubKey });
  }

  findByPkpPubKeyWithStatus(status: string, pkpPubKey: string) {
    return this.circuitModel.find({ pkpPubKey: pkpPubKey, status: status });
  }

  countByPkpPubKey(pkpPubKey: string) {
    return this.circuitModel.count({ pkpPubKey: pkpPubKey });
  }

  countByPkpPubKeyWithStatus(status: string, pkpPubKey: string) {
    return this.circuitModel.count({ pkpPubKey: pkpPubKey, status: status });
  }

  async addCircuitLog(id: ObjectId, log: ICircuitLog) {
    return this.circuitModel.updateOne(
      { _id: id },
      { $push: { circuitLogs: log } },
    );
  }

  async addConditionLog(id: ObjectId, log: IConditionLog) {
    return this.circuitModel.updateOne(
      { _id: id },
      { $push: { conditionLogs: log } },
    );
  }

  async addCheckWhenConditionMetLog(
    id: ObjectId,
    log: ICheckWhenConditionMetLog,
  ) {
    return this.circuitModel.updateOne(
      { _id: id },
      { $push: { checkWhenConditionMetLogs: log } },
    );
  }

  async addTransactionLog(id: ObjectId, log: ITransactionLog) {
    return this.circuitModel.updateOne(
      { _id: id },
      { $push: { transactionLogs: log } },
    );
  }

  async addUserOperationLog(id: ObjectId, log: IUserOperationLog) {
    return this.circuitModel.updateOne(
      { _id: id },
      { $push: { userOperationLogs: log } },
    );
  }

  async updateStatus(
    id: ObjectId,
    status: 'running' | 'stopped' | 'server-down-stopped',
  ) {
    return this.circuitModel.updateOne({ _id: id }, { $set: { status } });
  }

  async remove(id: string, body: ValidateCircuitDto) {
    // authSig or sessionSigs should be provided and not empty
    if (
      (!body.authSig || isEmpty(body.authSig)) &&
      (!body.sessionSigs || isEmpty(body.sessionSigs))
    ) {
      throw new Error('Must provide either authSig or sessionSigs');
    }
    const circuit = await this.findById(id);
    if (circuit.status === 'running') {
      throw new Error('Cannot remove a running circuit');
    }
    if (body.sessionSigs && !isEmpty(body.sessionSigs)) {
      const valid = validateSessionSigs(circuit.pkpPubKey, body.sessionSigs);
      if (!valid) {
        throw new Error('Invalid sessionSigs');
      }
      return this.circuitModel.deleteOne({ _id: id });
    } else {
      const valid = validateAuthSig(circuit.pkpPubKey, body.authSig);
      if (!valid) {
        throw new Error('Invalid authSig');
      }
      return this.circuitModel.deleteOne({ _id: id });
    }
  }

  adjustReactiveCircuitOptions(circuit: Circuit) {
    const { options, circuitLogs, conditionLogs } = circuit;
    if (options.maxLitActionCompletions) {
      circuitLogs.forEach((log) => {
        if (log.status === 'action complete') {
          options.maxLitActionCompletions -= 1;
        }
      });
    }
    if (options.conditionMonitorExecutions) {
      conditionLogs.forEach((log) => {
        if (log.status === 'matched') {
          options.conditionMonitorExecutions -= 1;
        }
      });
    }
    return options;
  }

  IConditionsToConditions(
    conditions: (
      | IWebhookCondition
      | IViemContractCondition
      | IViemEventCondition
    ) &
      {
        name?: string;
        description?: string;
      }[],
  ): (WebhookCondition | ViemContractCondition | ViemEventCondition)[] {
    return conditions.map(
      (
        condition: (
          | IWebhookCondition
          | IViemContractCondition
          | IViemEventCondition
        ) & {
          name?: string;
          description?: string;
        },
      ) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { name, description, ...rest } = condition;
        if (rest.type === 'webhook') {
          return new WebhookCondition(rest);
        } else if (rest.type === 'viem-contract') {
          return new ViemContractCondition(rest);
        } else if (rest.type === 'viem-event') {
          return new ViemEventCondition(rest);
        }
      },
    );
  }
}
