export type Transaction = {
  /**
   * Transaction timestamp (seconds)
   */
  time: number
  /**
   * Sender ID
   * e.g. "0x3e3dec7969CbeeD2B488a3ECb943386C5BAbC781"
   */
  txfrom: string
  /**
   * Recipient ID
   * e.g. 0x7e0Bd3F27EC0997A3B17045023097372b4c563B3
   */
  txto: string
  gas: number
  /**
   * Gas price in wei
   */
  gasprice: number
  block: number
  /**
   * e.g.: "0xca335cb7b871c58bf2d6e3a74e27f07d865daf1ed864bf9d06f6527c97d29a2b"
   * or: "\\x46b4147aaf88ce8ce7a05b003446bc77e6732c0c100ee30b12c5d23ff7be91c3"
   */
  txhash: string
  /**
   * ETH value in wei
   */
  value: number
  /**
   * Empty for ETH transfers
   */
  contract_to: string
  /**
   * Empty for ETH transfers
   */
  contract_value: string
  status: boolean | null
}
