// @vitest-environment node

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ESLint } from 'eslint'

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))
const probePath = path.join(repositoryRoot, 'src/lib/eslintImportCoverageProbe.js')
const eslint = new ESLint({
  cwd: repositoryRoot,
  overrideConfigFile: path.join(repositoryRoot, 'eslint.config.ts')
})
const ESLINT_IMPORT_TEST_TIMEOUT = 30_000

async function importRuleIds(source: string) {
  const [result] = await eslint.lintText(source, { filePath: probePath })

  return result.messages
    .map(({ ruleId }) => ruleId)
    .filter((ruleId): ruleId is string => ruleId?.startsWith('import-x/') === true)
}

describe('ESLint import correctness coverage', () => {
  it.each([
    [
      'missing default export',
      "import value from './__fixtures__/eslintImportCoverageModule.mjs'",
      'import-x/default'
    ],
    [
      'missing named export',
      "import { missing } from './__fixtures__/eslintImportCoverageModule.mjs'",
      'import-x/named'
    ],
    [
      'unresolved module',
      "import value from './__fixtures__/missingModule.js'",
      'import-x/no-unresolved'
    ]
  ])(
    'reports a %s',
    async (_case, source, expectedRule) => {
      await expect(importRuleIds(source)).resolves.toContain(expectedRule)
    },
    ESLINT_IMPORT_TEST_TIMEOUT
  )

  it(
    'accepts a valid named import',
    async () => {
      await expect(
        importRuleIds("import { namedExport } from './__fixtures__/eslintImportCoverageModule.mjs'")
      ).resolves.toEqual([])
    },
    ESLINT_IMPORT_TEST_TIMEOUT
  )
})
