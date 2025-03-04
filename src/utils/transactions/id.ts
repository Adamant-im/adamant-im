import {fromBuffer} from '../bignumber';
import {getHash, type SignedTransaction} from './hash';

export const getTransactionId = (transaction: SignedTransaction) => {
  if (!transaction.signature) {
    throw new Error('Transaction Signature is required');
  }

  const hash = getHash(transaction, {skipSignature: false});

  const temp = Buffer.alloc(8);
  for (let i = 0; i < 8; i++) {
    temp[i] = hash[7 - i];
  }

  return fromBuffer(temp).toString();
};
