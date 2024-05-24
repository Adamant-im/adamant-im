import { Transaction } from './transaction'

type OrderBy = keyof Transaction

export type GetTransactionsRequest = {
  /**
   * Query params
   * e.g. (contract_to.eq.,or(txfrom.eq.0x7e0Bd3F27EC0997A3B17045023097372b4c563B3,txto.eq.0x7e0Bd3F27EC0997A3B17045023097372b4c563B3))
   */
  and?: string
  /**
   * Order by
   */
  order?: `${OrderBy}.asc` | `${OrderBy}.desc`
  /**
   * Limit the number of transactions returned
   */
  limit?: number
}
