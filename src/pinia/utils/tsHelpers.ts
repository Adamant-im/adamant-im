/**
 * return True if P is `void`, otherwise return False
 * taken from https://github.com/reduxjs/redux-toolkit/blob/master/packages/toolkit/src/tsHelpers.ts
 *
 * @internal
 */
export type IfVoid<P, True, False> = [void] extends [P] ? True : False
