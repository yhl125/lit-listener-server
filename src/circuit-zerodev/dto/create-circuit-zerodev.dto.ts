import { AuthSig, LIT_NETWORKS_KEYS, SessionSigs } from '@lit-protocol/types';
import {
  IConditionalLogic,
  IExecutionConstraints,
  ViemContractCondition,
  ViemEventCondition,
  WebhookCondition,
  FetchActionZeroDevUserOperation,
  ZeroDevUserOperationAction,
} from '@lit-listener-sdk/types';

export class CreateCircuitZeroDevDto {
  name?: string;
  description?: string;
  litNetwork: LIT_NETWORKS_KEYS;
  pkpPubKey: string;
  conditions: (WebhookCondition | ViemContractCondition | ViemEventCondition) &
    { name?: string; description?: string }[];
  conditionalLogic: IConditionalLogic;
  options: IExecutionConstraints;
  actions: (FetchActionZeroDevUserOperation | ZeroDevUserOperationAction) &
    { name?: string; description?: string }[];
  authSig?: AuthSig;
  sessionSigs?: SessionSigs;
}
