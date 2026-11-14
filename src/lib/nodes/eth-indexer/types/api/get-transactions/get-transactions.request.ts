import { Transaction } from './transaction'

type OrderBy = keyof Transaction
type OrderClause = `${OrderBy}.asc` | `${OrderBy}.desc`

export type GetTransactionsRequest = {
  /**
   * Query params
   * e.g. (contract_to.eq.,or(txfrom.eq.0x7e0Bd3F27EC0997A3B17045023097372b4c563B3,txto.eq.0x7e0Bd3F27EC0997A3B17045023097372b4c563B3))
   */
  and?: string
  /**
   * Order by. A second clause makes the order total, which is what `offset`
   * paging needs to be deterministic: `time` is a block timestamp, not a key
   */
  order?: OrderClause | `${OrderClause},${OrderClause}`
  /**
   * Limit the number of transactions returned
   */
  limit?: number
  /**
   * Row offset. Only meaningful together with a deterministic `order`
   */
  offset?: number
}
