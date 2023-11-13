import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { CircuitZeroDev } from '@lit-listener-sdk/circuit-zerodev';
import { CreateCircuitZeroDevDto } from './dto/create-circuit-zerodev.dto';
import {
  FetchActionZeroDevUserOperation,
  ICheckWhenConditionMetLog,
  ICircuitLog,
  IConditionLog,
  ITransactionLog,
  IUserOperationLog,
  ViemContractCondition,
  ViemEventCondition,
  WebhookCondition,
  ZeroDevUserOperationAction,
} from '@lit-listener-sdk/types';
import { ObjectId } from 'bson';
import { CircuitService } from 'src/circuit/circuit.service';
import { AuthSig, SessionSigs } from '@lit-protocol/types';
import { isEmpty, validateAuthSig, validateSessionSigs } from 'src/utils';
import { ValidateCircuitDto } from 'src/circuit/dto/validate-circuit.dto';
import { SessionSigsDto } from 'src/circuit/dto/session-sigs.dto';

@Injectable()
export class CircuitZeroDevService implements OnModuleDestroy {
  constructor(private circuitService: CircuitService) {}
  private activeCircuits = new Map<ObjectId, CircuitZeroDev>();

  async onModuleDestroy() {
    await Promise.all(
      Array.from(this.activeCircuits.keys()).map((id) =>
        this.circuitService.updateStatus(id, 'server-down-stopped'),
      ),
    );
  }

  async create(createCircuitZeroDevDto: CreateCircuitZeroDevDto) {
    const circuit = this.createCircuitZeroDevWithDto(createCircuitZeroDevDto);
    const circuitModel = await this.createCircuitModel(
      circuit.id,
      createCircuitZeroDevDto,
    );
    this.listenToCircuitEvents(circuit);
    circuit.start();
    this.activeCircuits.set(circuit.id, circuit);
    return circuitModel;
  }

  private listenToCircuitEvents(circuit: CircuitZeroDev) {
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
    circuit.on('userOperationLog', (log: IUserOperationLog) => {
      this.circuitService.addUserOperationLog(circuit.id, log);
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
    actions: (FetchActionZeroDevUserOperation | ZeroDevUserOperationAction) &
      {
        name?: string;
        description?: string;
      }[],
  ): (FetchActionZeroDevUserOperation | ZeroDevUserOperationAction)[] {
    return actions.map(
      (
        action: (
          | FetchActionZeroDevUserOperation
          | ZeroDevUserOperationAction
        ) & {
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

  private createCircuitZeroDevWithDto(
    createCircuitZeroDevDto: CreateCircuitZeroDevDto,
  ) {
    return new CircuitZeroDev({
      litNetwork: createCircuitZeroDevDto.litNetwork,
      pkpPubKey: createCircuitZeroDevDto.pkpPubKey,
      conditions: this.removeNameAndDescriptionFromConditions(
        createCircuitZeroDevDto.conditions,
      ),
      conditionalLogic: createCircuitZeroDevDto.conditionalLogic,
      options: createCircuitZeroDevDto.options,
      actions: this.removeNameAndDescriptionFromActions(
        createCircuitZeroDevDto.actions,
      ),
      authSig: createCircuitZeroDevDto.authSig,
      sessionSigs: createCircuitZeroDevDto.sessionSigs,
    });
  }

  private createCircuitModel(
    id: ObjectId,
    createCircuitZeroDevDto: CreateCircuitZeroDevDto,
  ) {
    return this.circuitService.create({
      _id: id.toHexString(),
      name: createCircuitZeroDevDto.name,
      description: createCircuitZeroDevDto.description,
      type: 'zerodev',
      pkpPubKey: createCircuitZeroDevDto.pkpPubKey,
      litNetwork: createCircuitZeroDevDto.litNetwork,
      conditions: createCircuitZeroDevDto.conditions,
      conditionalLogic: createCircuitZeroDevDto.conditionalLogic,
      options: createCircuitZeroDevDto.options,
      actions: createCircuitZeroDevDto.actions,
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
    if (circuit.type !== 'zerodev') {
      throw new Error('Circuit is not zerodev');
    }
    if (body.sessionSigs && !isEmpty(body.sessionSigs)) {
      const newCircuit = new CircuitZeroDev({
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
            | FetchActionZeroDevUserOperation
            | ZeroDevUserOperationAction
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
      const newCircuit = new CircuitZeroDev({
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
            | FetchActionZeroDevUserOperation
            | ZeroDevUserOperationAction
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