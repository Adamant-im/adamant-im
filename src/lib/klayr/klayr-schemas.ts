export const TRANSACTION_SCHEMA = {
  $id: '/klayr/transaction',
  type: 'object',
  required: ['module', 'command', 'nonce', 'fee', 'senderPublicKey', 'params'],
  properties: {
    module: {
      dataType: 'string',
      fieldNumber: 1,
      minLength: 1,
      maxLength: 32
    },
    command: {
      dataType: 'string',
      fieldNumber: 2,
      minLength: 1,
      maxLength: 32
    },
    nonce: {
      dataType: 'uint64',
      fieldNumber: 3
    },
    fee: {
      dataType: 'uint64',
      fieldNumber: 4
    },
    senderPublicKey: {
      dataType: 'bytes',
      fieldNumber: 5,
      minLength: 32,
      maxLength: 32
    },
    params: {
      dataType: 'bytes',
      fieldNumber: 6
    },
    signatures: {
      type: 'array',
      items: {
        dataType: 'bytes'
      },
      fieldNumber: 7
    }
  }
}

export const TRANSACTION_PARAMS_SCHEMA = {
  $id: '/klayr/transferParams',
  title: 'Transfer transaction params',
  type: 'object',
  required: ['tokenID', 'amount', 'recipientAddress', 'data'],
  properties: {
    tokenID: {
      dataType: 'bytes',
      fieldNumber: 1,
      minLength: 8,
      maxLength: 8
    },
    amount: {
      dataType: 'uint64',
      fieldNumber: 2
    },
    recipientAddress: {
      dataType: 'bytes',
      fieldNumber: 3,
      format: 'klayr32'
    },
    data: {
      dataType: 'string',
      fieldNumber: 4,
      minLength: 0,
      maxLength: 64
    }
  }
}
