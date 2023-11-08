import { AuthSig, SessionSigs } from '@lit-protocol/types';
export class ValidateCircuitDto {
  authSig?: AuthSig;
  sessionSigs?: SessionSigs;
}
