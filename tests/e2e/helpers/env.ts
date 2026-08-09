import { readLiveEnv, warnMissingLiveEnv } from '../../shared/liveEnv'

export const testPassphrase = readLiveEnv('ADM_TEST_ACCOUNT_PK')

warnMissingLiveEnv(
  'playwright',
  ['ADM_TEST_ACCOUNT_PK'],
  'To enable account-based tests, add the test account passphrase to .env.local:\n\n' +
    '  # adm-test-main-U3716604363012166999\n' +
    '  ADM_TEST_ACCOUNT_PK="your test account passphrase here"'
)
