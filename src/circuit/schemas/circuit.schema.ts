import {
  IConditionalLogic,
  IExecutionConstraints,
  ICircuitLog,
  ICheckWhenConditionMetLog,
  IConditionLog,
  ITransactionLog,
  IUserOperationLog,
  IFetchActionViemTransaction,
  IFetchActionZeroDevUserOperation,
  IViemContractCondition,
  IViemEventCondition,
  IViemTransactionAction,
  IWebhookCondition,
  IZeroDevUserOperationAction,
} from '@lit-listener-sdk/types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { LIT_NETWORKS_KEYS } from '@lit-protocol/types';

export type CircuitDocument = HydratedDocument<Circuit>;

@Schema()
export class Circuit {
  @Prop()
  name?: string;

  @Prop()
  description?: string;

  @Prop()
  type: 'viem' | 'zerodev';

  @Prop({ default: 'running' })
  status: 'running' | 'stopped' | 'server-down-stopped';

  @Prop()
  pkpPubKey: string;

  @Prop()
  litNetwork: LIT_NETWORKS_KEYS;

  @Prop({ type: MongooseSchema.Types.Array })
  conditions: (
    | IWebhookCondition
    | IViemContractCondition
    | IViemEventCondition
  ) &
    { name?: string; description?: string }[];

  @Prop({ type: MongooseSchema.Types.Map })
  conditionalLogic: IConditionalLogic;

  @Prop({ type: MongooseSchema.Types.Map })
  options: IExecutionConstraints;

  @Prop({ type: MongooseSchema.Types.Array })
  actions: (
    | IFetchActionViemTransaction
    | IViemTransactionAction
    | IFetchActionZeroDevUserOperation
    | IZeroDevUserOperationAction
  ) &
    { name?: string; description?: string }[];

  @Prop({ type: MongooseSchema.Types.Array })
  circuitLogs: ICircuitLog[];

  @Prop({ type: MongooseSchema.Types.Array })
  conditionLogs: IConditionLog[];

  @Prop({ type: MongooseSchema.Types.Array })
  checkWhenConditionMetLogs: ICheckWhenConditionMetLog[];

  @Prop({ type: MongooseSchema.Types.Array })
  transactionLogs: ITransactionLog[];

  @Prop({ type: MongooseSchema.Types.Array })
  userOperationLogs: IUserOperationLog[];
}

export const CircuitSchema = SchemaFactory.createForClass(Circuit);
CircuitSchema.index({ pkpPubKey: 1 });
CircuitSchema.index({ pkpPubKey: 1, status: 1 });
