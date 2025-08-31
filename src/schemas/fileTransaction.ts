import { z } from 'zod'

// Schemas for validating transactions according to AIP-18 (https://github.com/Adamant-im/AIPs/blob/master/AIPS/aip-18.md)

export const filePreviewSchema = z.object({
  id: z.string(),
  nonce: z.string(),
  extension: z.string().optional()
})

export const fileSchema = z.object({
  id: z.string().nonempty(),
  mimeType: z.string().optional(),
  extension: z.string().optional(),
  size: z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)]),
  preview: filePreviewSchema.optional(),
  name: z.string().optional(),
  nonce: z.string().nonempty(),
  resolution: z.tuple([z.number(), z.number()]).optional(), // [width, height]
  duration: z.number().optional()
})

// Root object of transaction.asset.chat.message according to AIP-18 (later put in transaction.message after decoded)
export const fileMessageSchema = z.object({
  files: z.array(fileSchema).nonempty(),
  storage: z.object({ id: z.string() }),
  comment: z.string().optional()
})

// Simplified schema of the transaction
export const fileTransactionSchema = z.object({
  type: z.number().int(),
  amount: z.number().int(),
  senderId: z.string(),
  senderPublicKey: z.string(),
  asset: z.object({
    chat: z.object({
      message: z.union([z.string(), z.record(z.any())]), // encrypted, stringified JSON
      own_message: z.string().optional(),
      type: z.number().int().optional()
    })
  }),
  message: fileMessageSchema, // decoded message is put here and not kept inside asset.chat.message
  recipientId: z.string().optional(),
  timestamp: z.number().optional(),
  signature: z.string().optional()
})
