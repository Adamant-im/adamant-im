import { describe, expect, it } from 'vitest'
import { modalRegistry } from '@/components/modals/registry'

const dialogs = [
  'BuildInfoDialog',
  'BuyTokensDialog',
  'ChatStartDialog',
  'FreeTokensDialog',
  'HttpProtocolInfoDialog',
  'PartnerInfo',
  'PasswordSetDialog',
  'QrcodeRendererDialog',
  'QrcodeScannerDialog',
  'ShareURIDialog',
  'WarningOnAddressesDialog',
  'WarningOnPartnerAddressDialog'
]

describe('modal registry', () => {
  it.each(dialogs)('registers %s as a component', (name) => {
    expect(modalRegistry[name]).toBeTruthy()
  })

  it('does not register anything unexpected', () => {
    expect(Object.keys(modalRegistry).sort()).toEqual([...dialogs].sort())
  })
})
