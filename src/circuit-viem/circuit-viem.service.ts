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
import { isEmpty, validateAuthSig, validateSessionSigs } from 'src/utils';
import { ValidateCircuitDto } from 'src/circuit/dto/validate-circuit.dto';
import { SessionSigsDto } from 'src/circuit/dto/session-sigs.dto';

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
    this.listenToCircuitEvents(circuit);
    circuit.start();
    this.activeCircuits.set(circuit.id, circuit);
    return circuitModel;
  }

  private listenToCircuitEvents(circuit: CircuitViem) {
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
  }

  private removeNameAndDescriptionFromConditions(
    conditions: (
      | WebhookCondition
      | ViemContractCondition
      | ViemEventCondition
    ) &
      {
        name?: string;
        description?: string;
      }[],
  ): (WebhookCondition | ViemContractCondition | ViemEventCondition)[] {
    return conditions.map(
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
    );
  }

  private removeNameAndDescriptionFromActions(
    actions: (FetchActionViemTransaction | ViemTransactionAction) &
      {
        name?: string;
        description?: string;
      }[],
  ): (FetchActionViemTransaction | ViemTransactionAction)[] {
    return actions.map(
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
    );
  }

  private createCircuitViemWithDto(createCircuitViemDto: CreateCircuitViemDto) {
    return new CircuitViem({
      litNetwork: createCircuitViemDto.litNetwork,
      pkpPubKey: createCircuitViemDto.pkpPubKey,
      conditions: this.removeNameAndDescriptionFromConditions(
        createCircuitViemDto.conditions,
      ),
      conditionalLogic: createCircuitViemDto.conditionalLogic,
      options: createCircuitViemDto.options,
      actions: this.removeNameAndDescriptionFromActions(
        createCircuitViemDto.actions,
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
      litNetwork: createCircuitViemDto.litNetwork,
      conditions: createCircuitViemDto.conditions,
      conditionalLogic: createCircuitViemDto.conditionalLogic,
      options: createCircuitViemDto.options,
      actions: createCircuitViemDto.actions,
    });
  }

  async updateSessionSigs(id: string, sessionSigsDto: SessionSigsDto) {
    const circuit = this.activeCircuits.get(new ObjectId(id));
    if (!circuit) {
      throw new Error('Circuit not found');
    }
    const valid = await validateSessionSigs(
      circuit.pkpPubKey,
      sessionSigsDto.sessionSigs,
    );
    if (!valid) {
      throw new Error('Invalid SessionSigs');
    }
    circuit.updateSessionSigs(sessionSigsDto.sessionSigs);
    return 'SessionSigs updated';
  }

  async updateSessionSigsByPkpPubKey(
    pkpPubKey: string,
    sessionSigsDto: SessionSigsDto,
  ) {
    const valid = await validateSessionSigs(
      pkpPubKey,
      sessionSigsDto.sessionSigs,
    );
    if (!valid) {
      throw new Error('Invalid SessionSigs');
    }
    this.activeCircuits.forEach((circuit) => {
      if (circuit.pkpPubKey === pkpPubKey) {
        circuit.updateSessionSigs(sessionSigsDto.sessionSigs);
      }
    });

    return 'SessionSigs updated';
  }

  async reactivateServerDownCircuit(id: string, body: ValidateCircuitDto) {
    const circuit = await this.circuitService.findById(id);
    if (!circuit) {
      throw new Error('Circuit not found');
    }
    if (circuit.status !== 'server-down-stopped') {
      throw new Error('Circuit is not server-down-stopped');
    }
    if (circuit.type !== 'viem') {
      throw new Error('Circuit is not viem');
    }
    if (body.sessionSigs && !isEmpty(body.sessionSigs)) {
      const newCircuit = new CircuitViem({
        id: circuit._id,
        litNetwork: circuit.litNetwork,
        pkpPubKey: circuit.pkpPubKey,
        conditions: this.removeNameAndDescriptionFromConditions(
          circuit.conditions,
        ),
        conditionalLogic: circuit.conditionalLogic,
        options: this.circuitService.adjustReactiveCircuitOptions(circuit),
        actions: this.removeNameAndDescriptionFromActions(
          circuit.actions as (
            | FetchActionViemTransaction
            | ViemTransactionAction
          ) &
            { name?: string; description?: string }[],
        ),
        sessionSigs: body.sessionSigs,
      });

      this.listenToCircuitEvents(newCircuit);
      newCircuit.start();
      this.activeCircuits.set(newCircuit.id, newCircuit);
      await this.reactivatedCircuitLog(newCircuit.id);
      return this.circuitService.updateStatus(newCircuit.id, 'running');
    } else if (body.authSig && !isEmpty(body.authSig)) {
      const newCircuit = new CircuitViem({
        id: circuit._id,
        litNetwork: circuit.litNetwork,
        pkpPubKey: circuit.pkpPubKey,
        conditions: this.removeNameAndDescriptionFromConditions(
          circuit.conditions,
        ),
        conditionalLogic: circuit.conditionalLogic,
        options: this.circuitService.adjustReactiveCircuitOptions(circuit),
        actions: this.removeNameAndDescriptionFromActions(
          circuit.actions as (
            | FetchActionViemTransaction
            | ViemTransactionAction
          ) &
            { name?: string; description?: string }[],
        ),
        authSig: body.authSig,
      });

      this.listenToCircuitEvents(newCircuit);
      newCircuit.start();
      this.activeCircuits.set(newCircuit.id, newCircuit);
      await this.reactivatedCircuitLog(newCircuit.id);
      return this.circuitService.updateStatus(newCircuit.id, 'running');
    } else {
      throw new Error('Invalid body');
    }
  }

  private reactivatedCircuitLog(id: ObjectId) {
    return this.circuitService.addCircuitLog(id, {
      status: 'started',
      message: 'reactivated server-down-stopped circuit',
      isoDate: new Date().toISOString(),
    });
  }

  private async stopCircuitWithSessionSig(
    id: ObjectId,
    sessionSigs: SessionSigs,
  ) {
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

  private async stopCircuitWithAuthSig(id: ObjectId, authSig: AuthSig) {
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

  stop(id: string, body: ValidateCircuitDto) {
    if (body.authSig && !isEmpty(body.authSig)) {
      return this.stopCircuitWithAuthSig(new ObjectId(id), body.authSig);
    }
    if (body.sessionSigs && !isEmpty(body.sessionSigs)) {
      return this.stopCircuitWithSessionSig(new ObjectId(id), body.sessionSigs);
    }
    throw new Error('Invalid body');
  }
}
