import {
  WebhookCondition,
  ViemContractCondition,
  ViemEventCondition,
  IConditionalLogic,
  IExecutionConstraints,
  FetchActionViemTransaction,
  ViemTransactionAction,
  FetchActionZeroDevUserOperation,
  ZeroDevUserOperationAction,
} from '@lit-listener-sdk/types';

export class CreateCircuitDto {
  _id: string;

  name?: string;

  description?: string;

  type: 'viem' | 'zerodev';

  pkpPubKey: string;

  conditions: (WebhookCondition | ViemContractCondition | ViemEventCondition) &
    { name?: string; description?: string }[];

  conditionalLogic: IConditionalLogic;

  options: IExecutionConstraints;

  actions: (
    | FetchActionViemTransaction
    | ViemTransactionAction
    | FetchActionZeroDevUserOperation
    | ZeroDevUserOperationAction
  ) &
    { name?: string; description?: string }[];
}
