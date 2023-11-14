import { AuthSig, LIT_NETWORKS_KEYS, SessionSigs } from '@lit-protocol/types';
import {
  IConditionalLogic,
  IExecutionConstraints,
  IFetchActionZeroDevUserOperation,
  IViemContractCondition,
  IViemEventCondition,
  IWebhookCondition,
  IZeroDevUserOperationAction,
} from '@lit-listener-sdk/types';

export class CreateCircuitZeroDevDto {
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
  actions: (IFetchActionZeroDevUserOperation | IZeroDevUserOperationAction) &
    { name?: string; description?: string }[];
  authSig?: AuthSig;
  sessionSigs?: SessionSigs;
}
