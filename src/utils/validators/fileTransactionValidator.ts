import { fileTransactionSchema, fileMessageSchema } from '@/schemas/fileTransaction'
import { ValidationStatus, FileValidationResult } from '@/utils/validators/types/fileTransaction'

/**
 * Validates a transaction against AIP-18 (file-transfer).
 * Expects a decoded transaction (decoded message is kept inside tx.message).
 *
 * Checks:
 *  - Outer transaction shape (must match AIP-18 rules: type=8, amount=0, asset.chat.type=2).
 *  - File-message object inside tx.message.
 */
export function validateFileTransaction(tx: unknown): FileValidationResult {
  const errors: string[] = []

  // 1) Validate outer structure
  const outer = fileTransactionSchema.safeParse(tx)
  if (!outer.success) {
    errors.push(
      'Outer transaction shape invalid: ' +
        outer.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    )
    return { status: ValidationStatus.UNSUPPORTED, errors }
  }

  const txObj = outer.data

  // 2) Check AIP-18 specific constraints
  if (txObj.type !== 8) {
    errors.push(`transaction.type must be 8 (got ${txObj.type})`)
  }
  if (txObj.amount !== 0) {
    errors.push(`transaction.amount must be 0 (got ${txObj.amount})`)
  }
  if (txObj.asset.chat.type !== 2) {
    errors.push(`asset.chat.type must be 2 (Rich Content Message) (got ${txObj.asset.chat.type})`)
  }
  if (errors.length) {
    return { status: ValidationStatus.UNSUPPORTED, errors }
  }

  // 3) Validate message as file-message
  const fileMessage = fileMessageSchema.safeParse(txObj.message)
  if (!fileMessage.success) {
    errors.push(
      'Inner file-message object invalid: ' +
        fileMessage.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    )
    return { status: ValidationStatus.UNSUPPORTED, errors }
  }

  // 4) Return normalized object
  const normalized = JSON.parse(JSON.stringify(fileMessage.data))
  return { status: ValidationStatus.SUPPORTED, parsed: normalized }
}
