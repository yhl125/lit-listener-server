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
import { LIT_NETWORKS_KEYS } from '@lit-protocol/types';

export class CreateCircuitDto {
  _id: string;

  name?: string;

  description?: string;

  type: 'viem' | 'zerodev';

  pkpPubKey: string;

  litNetwork: LIT_NETWORKS_KEYS;

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
