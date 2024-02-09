export type ExtractMethods<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : never
}
