export type AccountExistsRequest = {
  /**
   * Token ID, 16 string chars, e.g. for KLY: "0000000000000000"
   */
  tokenID: string
} & AccountIdentifier

type AccountIdentifier =
  | {
      /**
       * KLY address
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
