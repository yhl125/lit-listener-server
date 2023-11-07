import { AuthSig, LIT_NETWORKS_KEYS, SessionSigs } from '@lit-protocol/types';
import {
  IConditionalLogic,
  IExecutionConstraints,
  FetchActionViemTransaction,
  ViemTransactionAction,
  ViemContractCondition,
  ViemEventCondition,
  WebhookCondition,
} from '@lit-listener-sdk/types';

export class CreateCircuitViemDto {
  name?: string;
  description?: string;
  litNetwork: LIT_NETWORKS_KEYS;
  pkpPubKey: string;
  conditions: (WebhookCondition | ViemContractCondition | ViemEventCondition) &
    { name?: string; description?: string }[];
  conditionalLogic: IConditionalLogic;
  options: IExecutionConstraints;
  actions: (FetchActionViemTransaction | ViemTransactionAction) &
    { name?: string; description?: string }[];
  authSig?: AuthSig;
  sessionSigs?: SessionSigs;
}
