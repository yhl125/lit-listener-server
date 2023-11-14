import {
  IConditionalLogic,
  IExecutionConstraints,
  IFetchActionViemTransaction,
  IFetchActionZeroDevUserOperation,
  IViemContractCondition,
  IViemEventCondition,
  IViemTransactionAction,
  IWebhookCondition,
  IZeroDevUserOperationAction,
} from '@lit-listener-sdk/types';
import { LIT_NETWORKS_KEYS } from '@lit-protocol/types';

export class CreateCircuitDto {
  _id: string;

  name?: string;

  description?: string;

  type: 'viem' | 'zerodev';

  pkpPubKey: string;

  litNetwork: LIT_NETWORKS_KEYS;

  conditions: (
    | IWebhookCondition
    | IViemContractCondition
    | IViemEventCondition
  ) &
    { name?: string; description?: string }[];

  conditionalLogic: IConditionalLogic;

  options: IExecutionConstraints;

  actions: (
    | IFetchActionViemTransaction
    | IViemTransactionAction
    | IFetchActionZeroDevUserOperation
    | IZeroDevUserOperationAction
  ) &
    { name?: string; description?: string }[];
}
