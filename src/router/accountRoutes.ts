export const ACCOUNT_PATH_PREFIXES = ['/home', '/transactions', '/transfer']

export const isAccountPath = (path?: string) => {
  return !!path && ACCOUNT_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))
}

export const resolveAccountRouteTarget = (path: string) => {
  const transactionDetailsMatch = path.match(/^\/transactions\/([^/]+)\/([^/]+)$/)

  if (transactionDetailsMatch) {
    const [, crypto, txId] = transactionDetailsMatch

    return {
      name: 'Transaction',
      params: {
        crypto,
        txId
      }
    }
  }

  const transactionListMatch = path.match(/^\/transactions\/([^/]+)$/)

  if (transactionListMatch) {
    const [, crypto] = transactionListMatch

    return {
      name: 'Transactions',
      params: {
        crypto
      }
    }
  }

  const sendFundsMatch = path.match(/^\/transfer(?:\/([^/]+))?(?:\/([^/]+))?(?:\/([^/]+))?$/)

  if (sendFundsMatch) {
    const [, cryptoCurrency, recipientAddress, amountToSend] = sendFundsMatch

    return {
      name: 'SendFunds',
      params: {
        ...(cryptoCurrency ? { cryptoCurrency } : {}),
        ...(recipientAddress ? { recipientAddress } : {}),
        ...(amountToSend ? { amountToSend } : {})
      }
    }
  }

  return path
}
