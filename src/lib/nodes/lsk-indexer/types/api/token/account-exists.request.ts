export type AccountExistsRequest = {
  /**
   * Token ID, 16 string chars, e.g. for LSK: "0000000000000000"
   */
  tokenID: string
} & AccountIdentifier

type AccountIdentifier =
  | {
      /**
       * LSK address
       */
      address: string
    }
  | {
      /**
       * Account public key
       */
      publicKey: string
    }
  | {
      /**
       * Account registered name
       */
      name: string
    }
