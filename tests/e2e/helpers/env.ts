import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local', quiet: true })

export const testPassphrase = process.env.ADM_TEST_ACCOUNT_PK?.trim()

if (!process.env.CI && !testPassphrase) {
  console.warn(
    '\n[playwright] ADM_TEST_ACCOUNT_PK is not set — account-based tests will be skipped.\n' +
      'To enable them, add the test account passphrase to .env.local:\n\n' +
      '  # adm-test-main-U3716604363012166999\n' +
      '  ADM_TEST_ACCOUNT_PK="your test account passphrase here"\n'
  )
}
