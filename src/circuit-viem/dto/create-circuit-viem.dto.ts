import { AuthSig, LIT_NETWORKS_KEYS, SessionSigs } from '@lit-protocol/types';
import {
  ICondition,
  IConditionalLogic,
  IExecutionConstraints,
  FetchActionViemTransaction,
  ViemTransactionAction,
} from '@lit-listener-sdk/types';

export class CreateCircuitViemDto {
  litNetwork: LIT_NETWORKS_KEYS;
  pkpPubKey: string;
  conditions: ICondition[];
  conditionalLogic: IConditionalLogic;
  options: IExecutionConstraints;
  actions: (FetchActionViemTransaction | ViemTransactionAction)[];
  authSig?: AuthSig;
  sessionSigs?: SessionSigs;
}
