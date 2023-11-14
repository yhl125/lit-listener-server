import { AuthSig, LIT_NETWORKS_KEYS, SessionSigs } from '@lit-protocol/types';
import {
  IConditionalLogic,
  IExecutionConstraints,
  IFetchActionViemTransaction,
  IViemContractCondition,
  IViemEventCondition,
  IViemTransactionAction,
  IWebhookCondition,
} from '@lit-listener-sdk/types';

export class CreateCircuitViemDto {
  name?: string;
  description?: string;
  litNetwork: LIT_NETWORKS_KEYS;
  pkpPubKey: string;
  conditions: (
    | IWebhookCondition
    | IViemContractCondition
    | IViemEventCondition
  ) &
    { name?: string; description?: string }[];
  conditionalLogic: IConditionalLogic;
  options: IExecutionConstraints;
  actions: (IFetchActionViemTransaction | IViemTransactionAction) &
    { name?: string; description?: string }[];
  authSig?: AuthSig;
  sessionSigs?: SessionSigs;
}
