export type AccountExistsResponse = {
  data: {
    isExists: boolean
  }
  meta: Record<string, never> // means and empty object: {}
}
