import type { Plugin } from 'vite'

const ECPAIR_TEST_MODULE = /\/node_modules\/ecpair\/src\/esm\/testecc\.js$/

/**
 * ECPair's ESM startup self-test references Buffer without importing it. Development dependency
 * optimization already injects the missing import, but a production renderer has no Buffer global.
 * Keep the compatibility shim lexical and limited to that exact third-party module.
 */
export function ecpairBufferImportPlugin(): Plugin {
  return {
    name: 'ecpair-buffer-import',
    enforce: 'pre',
    transform(code, id) {
      if (!ECPAIR_TEST_MODULE.test(id)) return null

      return {
        code: `import { Buffer } from 'buffer'\n${code}`,
        map: null
      }
    }
  }
}
