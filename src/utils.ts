import { PKPViemAccount } from 'pkp-viem';
import { AuthSig, SessionSigs } from '@lit-protocol/types';
import { verifyMessage } from 'viem';

export async function validateSessionSigs(
  pkpPubKey: string,
  sessionSigs: SessionSigs,
) {
  const account = new PKPViemAccount({
    controllerSessionSigs: sessionSigs,
    pkpPubKey,
  });
  const signature = await account.signMessage({ message: '' });
  const valid = await verifyMessage({
    address: account.address,
    message: '',
    signature,
  });
  return valid;
}

export async function validateAuthSig(pkpPubKey: string, authSig: AuthSig) {
  const account = new PKPViemAccount({
    controllerAuthSig: authSig,
    pkpPubKey,
  });
  const signature = await account.signMessage({ message: '' });
  const valid = await verifyMessage({
    address: account.address,
    message: '',
    signature,
  });
  return valid;
}
