import { isCI, readLiveEnv, warnMissingLiveEnv } from '../../shared/liveEnv'

const configuredPassphrase = readLiveEnv('ADM_TEST_ACCOUNT_PK')

if (isCI && configuredPassphrase) {
  throw new Error('Playwright account passphrases must not be available in CI')
}

export const testPassphrase = isCI ? undefined : configuredPassphrase

warnMissingLiveEnv(
  'playwright',
  ['ADM_TEST_ACCOUNT_PK'],
  'To enable account-based tests, add the test account passphrase to .env.local:\n\n' +
    '  # adm-test-main-U3716604363012166999\n' +
    '  ADM_TEST_ACCOUNT_PK="your test account passphrase here"'
)
