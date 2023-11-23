import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { CircuitZeroDev } from '@lit-listener-sdk/circuit-zerodev';
import { CreateCircuitZeroDevDto } from './dto/create-circuit-zerodev.dto';
import {
  FetchActionZeroDevUserOperation,
  ICheckWhenConditionMetLog,
  ICircuitLog,
  IConditionLog,
  IFetchActionZeroDevUserOperation,
  ITransactionLog,
  IUserOperationLog,
  IViemContractCondition,
  IViemEventCondition,
  IWebhookCondition,
  IZeroDevUserOperationAction,
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
  private activeCircuits = new Map<string, CircuitZeroDev>();

  async onModuleDestroy() {
    await Promise.all(
      Array.from(this.activeCircuits.keys()).map((id) =>
        this.circuitService.updateStatus(id, 'server-down-stopped'),
      ),
    );
  }

  async create(createCircuitZeroDevDto: CreateCircuitZeroDevDto) {
    const conditions = this.circuitService.IConditionsToConditions(
      createCircuitZeroDevDto.conditions,
    );
    const actions = this.IActionsToActions(createCircuitZeroDevDto.actions);
    const circuit = this.createCircuitZeroDevWithDto(
      createCircuitZeroDevDto,
      conditions,
      actions,
    );
    // add id to createCircuitZeroDevDto.conditions from conditions
    createCircuitZeroDevDto.conditions.forEach(
      (
        condition: (
          | IWebhookCondition
          | IViemContractCondition
          | IViemEventCondition
        ) & { name?: string; description?: string },
        index,
      ) => {
        condition.id = conditions[index].id;
      },
    );
    // add id to createCircuitZeroDevDto.actions from actions
    createCircuitZeroDevDto.actions.forEach(
      (
        action: (
          | IFetchActionZeroDevUserOperation
          | IZeroDevUserOperationAction
        ) & {
          name?: string;
          description?: string;
        },
        index,
      ) => {
        action.id = actions[index].id;
      },
    );
    const circuitModel = await this.createCircuitModel(
      circuit.id,
      createCircuitZeroDevDto,
    );
    this.listenToCircuitEvents(circuit);
    circuit.start();
    this.activeCircuits.set(circuit.id.toHexString(), circuit);
    return circuitModel;
  }

  private listenToCircuitEvents(circuit: CircuitZeroDev) {
    circuit.on('circuitLog', (log: ICircuitLog) => {
      this.circuitService.addCircuitLog(circuit.id, log);
      if (log.status === 'stop') {
        this.activeCircuits.delete(circuit.id.toHexString());
        this.circuitService.updateStatus(circuit.id.toHexString(), 'stopped');
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

  private IActionsToActions(
    actions: (IFetchActionZeroDevUserOperation | IZeroDevUserOperationAction) &
      {
        name?: string;
        description?: string;
      }[],
  ): (FetchActionZeroDevUserOperation | ZeroDevUserOperationAction)[] {
    return actions.map(
      (
        action: (
          | IFetchActionZeroDevUserOperation
          | IZeroDevUserOperationAction
        ) & {
          name?: string;
          description?: string;
        },
      ) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { name, description, ...rest } = action;
        if (rest.type === 'fetch-zerodev') {
          return new FetchActionZeroDevUserOperation(rest);
        } else if (rest.type === 'zerodev') {
          return new ZeroDevUserOperationAction(rest);
        }
      },
    );
  }

  private createCircuitZeroDevWithDto(
    createCircuitZeroDevDto: CreateCircuitZeroDevDto,
    conditions: (
      | WebhookCondition
      | ViemContractCondition
      | ViemEventCondition
    )[],
    actions: (FetchActionZeroDevUserOperation | ZeroDevUserOperationAction)[],
  ) {
    return new CircuitZeroDev({
      litNetwork: createCircuitZeroDevDto.litNetwork,
      pkpPubKey: createCircuitZeroDevDto.pkpPubKey,
      conditions: conditions,
      conditionalLogic: createCircuitZeroDevDto.conditionalLogic,
      options: createCircuitZeroDevDto.options,
      actions: actions,
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
    const circuit = this.activeCircuits.get(id);
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
        conditions: this.circuitService.IConditionsToConditions(
          circuit.conditions,
        ),
        conditionalLogic: circuit.conditionalLogic,
        options: this.circuitService.adjustReactiveCircuitOptions(circuit),
        actions: this.IActionsToActions(
          circuit.actions as (
            | IFetchActionZeroDevUserOperation
            | IZeroDevUserOperationAction
          ) &
            { name?: string; description?: string }[],
        ),
        sessionSigs: body.sessionSigs,
      });

      this.listenToCircuitEvents(newCircuit);
      newCircuit.start();
      this.activeCircuits.set(newCircuit.id.toHexString(), newCircuit);
      await this.reactivatedCircuitLog(newCircuit.id);
      return this.circuitService.updateStatus(
        newCircuit.id.toHexString(),
        'running',
      );
    } else if (body.authSig && !isEmpty(body.authSig)) {
      const newCircuit = new CircuitZeroDev({
        id: circuit._id,
        litNetwork: circuit.litNetwork,
        pkpPubKey: circuit.pkpPubKey,
        conditions: this.circuitService.IConditionsToConditions(
          circuit.conditions,
        ),
        conditionalLogic: circuit.conditionalLogic,
        options: this.circuitService.adjustReactiveCircuitOptions(circuit),
        actions: this.IActionsToActions(
          circuit.actions as (
            | IFetchActionZeroDevUserOperation
            | IZeroDevUserOperationAction
          ) &
            { name?: string; description?: string }[],
        ),
        authSig: body.authSig,
      });

      this.listenToCircuitEvents(newCircuit);
      newCircuit.start();
      this.activeCircuits.set(newCircuit.id.toHexString(), newCircuit);
      await this.reactivatedCircuitLog(newCircuit.id);
      return this.circuitService.updateStatus(
        newCircuit.id.toHexString(),
        'running',
      );
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
    id: string,
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

  private async stopCircuitWithAuthSig(id: string, authSig: AuthSig) {
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
      return this.stopCircuitWithAuthSig(id, body.authSig);
    }
    if (body.sessionSigs && !isEmpty(body.sessionSigs)) {
      return this.stopCircuitWithSessionSig(id, body.sessionSigs);
    }
    throw new Error('Invalid body');
  }
}
