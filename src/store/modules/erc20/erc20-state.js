export default function initialState (crypto, contractAddress, decimals) {
  return {
    crypto,
    contractAddress,
    decimals,
    balance: 0,
    address: '',
    publicKey: null,
    privateKey: null,
    transactions: { }
  }
}
