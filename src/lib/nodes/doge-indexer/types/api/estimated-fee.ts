/**
 * Estimated fee response
 *
 * `nbBlocks` is passed as a parameter to the API endpoint
 */
export type EstimatedFee = {
  [nbBlocks: string]: number
}

export type GetEstimatedFeeParams = {
  nbBlocks?: number
}
