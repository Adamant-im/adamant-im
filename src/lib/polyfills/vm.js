/**
 * Browser shim for Node.js `vm`.
 * `asn1.js` safely falls back when this function throws.
 */
export function runInThisContext() {
  throw new Error('vm.runInThisContext is not available in browser runtime')
}

export default {
  runInThisContext
}
