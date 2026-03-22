import { expect, test, type Page } from '@playwright/test'
import { dismissAddressWarningIfVisible, loginWithPassphrase } from './helpers/auth'
import { testPassphrase } from './helpers/env'

const LIVE_TIMEOUT = 180_000

const recipients = {
  ADM: 'U12345678901234567890',
  BTC: 'bc1ql3e9pgs3mmwuwrh95fecme0s0qtn2880lsvsd5',
  ETH: '0x000000000000000000000000000000000000dEaD',
  USDT: '0x000000000000000000000000000000000000dEaD',
  DOGE: 'DU9umLs2Ze8eNRo69wbSj5HeufphJawFPh',
  DASH: 'Xyhf4LaHDwSwzND5HEv72qoqrsg625rCMt'
} as const

const dustAmounts = {
  ADM: '0.0000000001',
  BTC: '0.0000000001',
  ETH: '0.0000000001',
  USDT: '0.0000001',
  DOGE: '0.5',
  DASH: '0.000001'
} as const

const spendableCryptos = ['ADM', 'BTC', 'ETH', 'USDT', 'DOGE', 'DASH'] as const

type SpendableCrypto = (typeof spendableCryptos)[number]

type RuntimeWalletState = {
  address: string
  balance: number
  balanceStatus: string
  ready: boolean
  feeRate?: number
  utxoCount?: number
}

type SendFundsSnapshot = {
  allowIncreaseFee: boolean
  amountString: string
  balance: number
  cryptoAddress: string
  currency: string
  dialog: boolean
  estimatedGasLimit: number | null
  exponent: number
  increaseFee: boolean
  maxToTransfer: number
  minToTransfer: number
  transferFee: number
}

const getRuntimeWalletState = async (
  page: Page,
  crypto: SpendableCrypto
): Promise<RuntimeWalletState> => {
  return page.evaluate((symbol) => {
    const runtime = window as Window & {
      store?: {
        state: Record<string, any>
      }
    }
    const store = runtime.store

    if (!store) {
      throw new Error('window.store is not available')
    }

    if (symbol === 'ADM') {
      return {
        address: store.state.address ?? '',
        balance: Number(store.state.balance ?? 0),
        balanceStatus: String(store.state.balanceStatus ?? ''),
        ready: Boolean(store.state.address) && store.state.balanceStatus === 'success'
      }
    }

    const walletState = store.state[symbol.toLowerCase()] ?? {}

    return {
      address: String(walletState.address ?? ''),
      balance: Number(walletState.balance ?? 0),
      balanceStatus: String(walletState.balanceStatus ?? ''),
      ready: Boolean(walletState.address) && walletState.balanceStatus === 'success',
      feeRate: Number(walletState.feeRate ?? 0),
      utxoCount: Array.isArray(walletState.utxo) ? walletState.utxo.length : 0
    }
  }, crypto)
}

const getSendFundsSnapshot = async (page: Page): Promise<SendFundsSnapshot> => {
  return page.evaluate(() => {
    const host = document.querySelector('.send-funds-form') as {
      __vueParentComponent?: {
        proxy?: Record<string, any>
      }
    } | null
    const vm = host?.__vueParentComponent?.proxy

    if (!vm) {
      throw new Error('SendFundsForm vm is not available')
    }

    return {
      allowIncreaseFee: Boolean(vm.allowIncreaseFee),
      amountString: String(vm.amountString ?? ''),
      balance: Number(vm.balance ?? 0),
      cryptoAddress: String(vm.cryptoAddress ?? ''),
      currency: String(vm.currency ?? ''),
      dialog: Boolean(vm.dialog),
      estimatedGasLimit: vm.estimatedGasLimit == null ? null : Number(vm.estimatedGasLimit),
      exponent: Number(vm.exponent ?? 0),
      increaseFee: Boolean(vm.increaseFee),
      maxToTransfer: Number(vm.maxToTransfer ?? 0),
      minToTransfer: Number(vm.minToTransfer ?? 0),
      transferFee: Number(vm.transferFee ?? 0)
    }
  })
}

const formatAmount = (amount: number, decimals: number) => {
  return amount.toFixed(decimals).replace(/\.?0+$/, '')
}

const floorAmount = (amount: number, decimals: number) => {
  const factor = 10 ** decimals
  return formatAmount(Math.floor(amount * factor) / factor, decimals)
}

const getAddressInput = (page: Page) =>
  page.locator('.send-funds-form .a-input').nth(1).locator('input')
const getAmountInput = (page: Page) => page.locator('.send-funds-form__amount-input input')
const getConfirmDialog = (page: Page) => page.locator('.send-funds-confirm-dialog')
const getSnackbar = (page: Page) => page.locator('.app-snackbar')

const waitForWalletReady = async (page: Page, crypto: SpendableCrypto) => {
  await expect
    .poll(
      async () => {
        const wallet = await getRuntimeWalletState(page, crypto)

        if (!wallet.ready || !wallet.address || wallet.balance <= 0) {
          return false
        }

        if (crypto === 'BTC') {
          return (wallet.feeRate ?? 0) > 0 && (wallet.utxoCount ?? 0) > 0
        }

        return true
      },
      {
        timeout: LIVE_TIMEOUT
      }
    )
    .toBe(true)

  const wallet = await getRuntimeWalletState(page, crypto)

  if (crypto === 'BTC') {
    expect(wallet.feeRate ?? 0).toBeGreaterThan(0)
    expect(wallet.utxoCount ?? 0).toBeGreaterThan(0)
  }

  expect(wallet.address).not.toBe('')
  expect(wallet.balance).toBeGreaterThan(0)

  return wallet
}

const openTransferScreen = async (page: Page, crypto: SpendableCrypto) => {
  await page.goto(`/transfer/${crypto}`, { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(new RegExp(`/transfer/${crypto}$`))
  await dismissAddressWarningIfVisible(page, 8_000)
  await expect(page.locator('.send-funds-form')).toBeVisible()

  await expect
    .poll(() => getSendFundsSnapshot(page).then((snapshot) => snapshot.currency), {
      timeout: LIVE_TIMEOUT
    })
    .toBe(crypto)

  await expect
    .poll(() => getSendFundsSnapshot(page).then((snapshot) => snapshot.balance), {
      timeout: LIVE_TIMEOUT
    })
    .toBeGreaterThan(0)
}

const fillRecipient = async (page: Page, recipient: string) => {
  const addressInput = getAddressInput(page)
  await expect(addressInput).toBeVisible()
  await addressInput.fill(recipient)

  await expect
    .poll(() => getSendFundsSnapshot(page).then((snapshot) => snapshot.cryptoAddress), {
      timeout: 15_000
    })
    .toBe(recipient)
}

const pickSendAllAmount = async (page: Page) => {
  await expect
    .poll(() => getSendFundsSnapshot(page).then((snapshot) => snapshot.maxToTransfer), {
      timeout: 30_000
    })
    .toBeGreaterThan(0)

  await page.locator('.send-funds-form__menu-activator').nth(1).click()

  const sendAllOption = page
    .locator('.v-overlay .send-funds-form__menu-item-title')
    .filter({ hasText: 'Send all' })
    .last()

  await expect(sendAllOption).toBeVisible()
  await sendAllOption.click()

  let snapshot = await getSendFundsSnapshot(page)
  if (Number(snapshot.amountString || 0) <= 0 && snapshot.maxToTransfer > 0) {
    const safeAmount = floorAmount(snapshot.maxToTransfer, snapshot.exponent)
    await getAmountInput(page).fill(safeAmount)
    snapshot = await getSendFundsSnapshot(page)
  }

  await expect
    .poll(() => getSendFundsSnapshot(page).then((snapshot) => Number(snapshot.amountString || 0)), {
      timeout: 30_000
    })
    .toBeGreaterThan(0)

  const safeAmount = floorAmount(snapshot.maxToTransfer, snapshot.exponent)

  if (
    Number(snapshot.amountString || 0) > snapshot.maxToTransfer ||
    Number(snapshot.amountString || 0) > Number(safeAmount)
  ) {
    await getAmountInput(page).fill(safeAmount)
  }
}

const setIncreaseFee = async (page: Page, enabled: boolean) => {
  const snapshot = await getSendFundsSnapshot(page)
  expect(snapshot.allowIncreaseFee).toBe(true)

  if (snapshot.increaseFee === enabled) {
    return
  }

  const toggle = page.getByRole('checkbox', { name: 'Increase fee' })
  await expect(toggle).toBeVisible()
  await toggle.click()

  await expect
    .poll(() => getSendFundsSnapshot(page).then((nextSnapshot) => nextSnapshot.increaseFee), {
      timeout: 15_000
    })
    .toBe(enabled)
}

const expectConfirmationAndCancel = async (
  page: Page,
  crypto: SpendableCrypto,
  recipient: string
) => {
  const dialog = getConfirmDialog(page)

  await page.locator('.send-funds-form__button').click()
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Transfer confirmation')
  await expect(dialog).toContainText(crypto)
  await expect(dialog).toContainText(recipient)

  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
}

const waitForTransferFee = async (page: Page) => {
  await expect
    .poll(() => getSendFundsSnapshot(page).then((snapshot) => snapshot.transferFee), {
      timeout: 30_000
    })
    .toBeGreaterThan(0)
}

const clampAmountToCurrentMax = async (page: Page) => {
  const snapshot = await getSendFundsSnapshot(page)
  const currentAmount = Number(snapshot.amountString || 0)

  if (currentAmount <= 0 || currentAmount <= snapshot.maxToTransfer) {
    return
  }

  const safeAmount = floorAmount(snapshot.maxToTransfer, snapshot.exponent)
  await getAmountInput(page).fill(safeAmount)

  await expect
    .poll(
      () =>
        getSendFundsSnapshot(page).then((nextSnapshot) => Number(nextSnapshot.amountString || 0)),
      {
        timeout: 15_000
      }
    )
    .toBeLessThanOrEqual(snapshot.maxToTransfer)
}

const expectSnackbarMessage = async (page: Page, message: RegExp) => {
  const snackbar = getSnackbar(page)
  await expect(snackbar).toBeVisible()
  await expect(snackbar).toContainText(message)
}

const closeSnackbar = async (page: Page) => {
  const snackbar = getSnackbar(page)
  if (!(await snackbar.isVisible().catch(() => false))) {
    return
  }

  const closeButton = snackbar.locator('.app-snackbar__close-button')

  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click()
    await expect(snackbar).toBeHidden()
    return
  }

  await expect(snackbar).toBeHidden({ timeout: 5_000 })
}

const runSupportedIncreaseFeeFlow = async (page: Page, crypto: 'BTC' | 'ETH' | 'USDT') => {
  await openTransferScreen(page, crypto)
  await fillRecipient(page, recipients[crypto])

  await setIncreaseFee(page, false)
  await pickSendAllAmount(page)
  await waitForTransferFee(page)
  await clampAmountToCurrentMax(page)
  const offSnapshot = await getSendFundsSnapshot(page)
  expect(offSnapshot.transferFee).toBeGreaterThan(0)
  expect(Number(offSnapshot.amountString)).toBeGreaterThan(0)
  await expectConfirmationAndCancel(page, crypto, recipients[crypto])

  await setIncreaseFee(page, true)
  await pickSendAllAmount(page)
  await waitForTransferFee(page)
  await clampAmountToCurrentMax(page)
  const onSnapshot = await getSendFundsSnapshot(page)

  expect(onSnapshot.transferFee).toBeGreaterThan(offSnapshot.transferFee)
  if (crypto === 'USDT') {
    expect(Number(onSnapshot.amountString)).toBe(Number(offSnapshot.amountString))
  } else {
    expect(Number(onSnapshot.amountString)).toBeLessThan(Number(offSnapshot.amountString))
  }
  await expectConfirmationAndCancel(page, crypto, recipients[crypto])
}

const runNoToggleFlow = async (page: Page, crypto: 'ADM' | 'DOGE' | 'DASH') => {
  await openTransferScreen(page, crypto)
  await fillRecipient(page, recipients[crypto])

  const snapshot = await getSendFundsSnapshot(page)
  expect(snapshot.allowIncreaseFee).toBe(false)
  await expect(page.locator('.send-funds-form .v-selection-control')).toHaveCount(0)

  await pickSendAllAmount(page)
  await waitForTransferFee(page)
  await clampAmountToCurrentMax(page)
  const sendAllSnapshot = await getSendFundsSnapshot(page)

  expect(sendAllSnapshot.transferFee).toBeGreaterThan(0)
  expect(Number(sendAllSnapshot.amountString)).toBeGreaterThan(0)
  await expectConfirmationAndCancel(page, crypto, recipients[crypto])
}

const expectValidationError = async (page: Page, amount: string, message: RegExp) => {
  const amountInput = getAmountInput(page)
  const dialog = getConfirmDialog(page)

  await amountInput.fill(amount)
  await page.locator('.send-funds-form__button').click()

  await expect(dialog).toBeHidden()
  await expectSnackbarMessage(page, message)
  await closeSnackbar(page)

  await expect
    .poll(() => getSendFundsSnapshot(page).then((snapshot) => snapshot.dialog), {
      timeout: 5_000
    })
    .toBe(false)
}

test.describe('Send funds live-account no-broadcast regressions', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!testPassphrase, 'Requires ADM_TEST_ACCOUNT_PK in .env.local')

    await page.setViewportSize({ width: 1366, height: 900 })
    await loginWithPassphrase(page, testPassphrase!)
  })

  test('reaches confirmation for 100% ADM send and keeps Increase fee unavailable', async ({
    page
  }) => {
    test.slow()
    await waitForWalletReady(page, 'ADM')
    await runNoToggleFlow(page, 'ADM')
  })

  test('reaches confirmation for 100% BTC send with Increase fee off and on', async ({ page }) => {
    test.slow()
    await waitForWalletReady(page, 'BTC')
    await runSupportedIncreaseFeeFlow(page, 'BTC')
  })

  test('reaches confirmation for 100% ETH send with Increase fee off and on', async ({ page }) => {
    test.slow()
    await waitForWalletReady(page, 'ETH')
    await runSupportedIncreaseFeeFlow(page, 'ETH')
  })

  test('reaches confirmation for 100% USDT send with Increase fee off and on', async ({ page }) => {
    test.slow()
    await waitForWalletReady(page, 'USDT')
    await runSupportedIncreaseFeeFlow(page, 'USDT')
  })

  test('reaches confirmation for 100% DOGE send and keeps Increase fee unavailable', async ({
    page
  }) => {
    test.slow()
    await waitForWalletReady(page, 'DOGE')
    await runNoToggleFlow(page, 'DOGE')
  })

  test('reaches confirmation for 100% DASH send and keeps Increase fee unavailable', async ({
    page
  }) => {
    test.slow()
    await waitForWalletReady(page, 'DASH')
    await runNoToggleFlow(page, 'DASH')
  })

  test('shows validation errors for below-min and above-balance amounts without opening confirmation', async ({
    page
  }) => {
    test.slow()

    for (const crypto of spendableCryptos) {
      await waitForWalletReady(page, crypto)
      await openTransferScreen(page, crypto)
      await fillRecipient(page, recipients[crypto])

      await expectValidationError(page, dustAmounts[crypto], /Dust amount/i)

      const snapshot = await getSendFundsSnapshot(page)
      const tooMuchAmount = formatAmount(snapshot.maxToTransfer + 1, snapshot.exponent)

      await expectValidationError(page, tooMuchAmount, /Not enough tokens/i)
    }
  })
})
