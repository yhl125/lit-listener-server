import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { CircuitViem } from '@lit-listener-sdk/circuit-viem';
import { CreateCircuitViemDto } from './dto/create-circuit-viem.dto';
import {
  FetchActionViemTransaction,
  ICheckWhenConditionMetLog,
  ICircuitLog,
  IConditionLog,
  ITransactionLog,
  ViemContractCondition,
  ViemEventCondition,
  ViemTransactionAction,
  WebhookCondition,
} from '@lit-listener-sdk/types';
import { ObjectId } from 'bson';
import { CircuitService } from 'src/circuit/circuit.service';
import { AuthSig, SessionSigs } from '@lit-protocol/types';
import { validateAuthSig, validateSessionSigs } from 'src/utils';

@Injectable()
export class CircuitViemService implements OnModuleDestroy {
  constructor(private circuitService: CircuitService) {}
  private activeCircuits = new Map<ObjectId, CircuitViem>();

  async onModuleDestroy() {
    await Promise.all(
      Array.from(this.activeCircuits.keys()).map((id) =>
        this.circuitService.updateStatus(id, 'server-down-stopped'),
      ),
    );
  }

  async create(createCircuitViemDto: CreateCircuitViemDto) {
    const circuit = this.createCircuitViemWithDto(createCircuitViemDto);
    const circuitModel = await this.createCircuitModel(
      circuit.id,
      createCircuitViemDto,
    );
    circuit.on('circuitLog', (log: ICircuitLog) => {
      this.circuitService.addCircuitLog(circuit.id, log);
      if (log.status === 'stop') {
        this.activeCircuits.delete(circuit.id);
        this.circuitService.updateStatus(circuit.id, 'stopped');
      }
    });
    circuit.on('conditionLog', (log: IConditionLog) => {
      this.circuitService.addConditionLog(circuit.id, log);
    });
    circuit.on('checkWhenConditionMetLog', (log: ICheckWhenConditionMetLog) => {
      this.circuitService.addCheckWhenConditionMetLog(circuit.id, log);
    });
    circuit.on('transactionLog', (log: ITransactionLog) => {
      this.circuitService.addTransactionLog(circuit.id, log);
    });
    circuit.start();
    this.activeCircuits.set(circuit.id, circuit);
    return circuitModel;
  }

  private createCircuitViemWithDto(createCircuitViemDto: CreateCircuitViemDto) {
    return new CircuitViem({
      litNetwork: createCircuitViemDto.litNetwork,
      pkpPubKey: createCircuitViemDto.pkpPubKey,
      conditions: createCircuitViemDto.conditions.map(
        (
          condition: (
            | WebhookCondition
            | ViemContractCondition
            | ViemEventCondition
          ) & {
            name?: string;
            description?: string;
          },
        ) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { name, description, ...rest } = condition;
          return rest;
        },
      ),
      conditionalLogic: createCircuitViemDto.conditionalLogic,
      options: createCircuitViemDto.options,
      actions: createCircuitViemDto.actions.map(
        (
          action: (FetchActionViemTransaction | ViemTransactionAction) & {
            name?: string;
            description?: string;
          },
        ) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { name, description, ...rest } = action;
          return rest;
        },
      ),
      authSig: createCircuitViemDto.authSig,
      sessionSigs: createCircuitViemDto.sessionSigs,
    });
  }

  private createCircuitModel(
    id: ObjectId,
    createCircuitViemDto: CreateCircuitViemDto,
  ) {
    return this.circuitService.create({
      _id: id.toHexString(),
      name: createCircuitViemDto.name,
      description: createCircuitViemDto.description,
      type: 'viem',
      pkpPubKey: createCircuitViemDto.pkpPubKey,
      conditions: createCircuitViemDto.conditions,
      conditionalLogic: createCircuitViemDto.conditionalLogic,
      options: createCircuitViemDto.options,
      actions: createCircuitViemDto.actions,
    });
  }

  async updateSessionSigs(id: ObjectId, sessionSigs: SessionSigs) {
    const circuit = this.activeCircuits.get(id);
    if (!circuit) {
      throw new Error('Circuit not found');
    }
    const valid = await validateSessionSigs(circuit.pkpPubKey, sessionSigs);
    if (!valid) {
      throw new Error('Invalid SessionSigs');
    }
    circuit.updateSessionSigs(sessionSigs);
    return 'SessionSigs updated';
  }

  async stopCircuitWithSessionSig(id: ObjectId, sessionSigs: SessionSigs) {
    const circuit = this.activeCircuits.get(id);
    if (!circuit) {
      throw new Error('Circuit not found');
    }
    const valid = await validateSessionSigs(circuit.pkpPubKey, sessionSigs);
    if (!valid) {
      throw new Error('Invalid SessionSigs');
    }
    circuit.terminate();
    return this.activeCircuits.delete(id);
  }

  async stopCircuitWithAuthSig(id: ObjectId, authSig: AuthSig) {
    const circuit = this.activeCircuits.get(id);
    if (!circuit) {
      throw new Error('Circuit not found');
    }
    const valid = await validateAuthSig(circuit.pkpPubKey, authSig);
    if (!valid) {
      throw new Error('Invalid SessionSigs');
    }
    circuit.terminate();
    return this.activeCircuits.delete(id);
  }
}
