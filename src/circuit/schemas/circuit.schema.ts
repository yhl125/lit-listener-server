import {
  IConditionalLogic,
  IExecutionConstraints,
  ViemContractCondition,
  ViemEventCondition,
  WebhookCondition,
  FetchActionViemTransaction,
  FetchActionZeroDevUserOperation,
  ViemTransactionAction,
  ZeroDevUserOperationAction,
  ICircuitLog,
  ICheckWhenConditionMetLog,
  IConditionLog,
  ITransactionLog,
  IUserOperationLog,
} from '@lit-listener-sdk/types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

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
  status: 'running' | 'stopped';

  @Prop()
  pkpPubKey: string;

  @Prop({ type: MongooseSchema.Types.Array })
  conditions: (WebhookCondition | ViemContractCondition | ViemEventCondition) &
    { name?: string; description?: string }[];

  @Prop({ type: MongooseSchema.Types.Map })
  conditionalLogic: IConditionalLogic;

  @Prop({ type: MongooseSchema.Types.Map })
  options: IExecutionConstraints;

  @Prop({ type: MongooseSchema.Types.Array })
  actions: (
    | FetchActionViemTransaction
    | ViemTransactionAction
    | FetchActionZeroDevUserOperation
    | ZeroDevUserOperationAction
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
