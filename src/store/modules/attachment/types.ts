export type AttachmentImage = {
  preview_nonce: string
  file_resolution: Array<number>
  file_id: string
  file_type: string
  file_size: number
  file_name: string
  preview_id: string
  nonce: string
}

export type AttachmentMessage = {
  files: Array<AttachmentImage>
  storage: Storage | string
  comment: string
}

export type Storage = {
  name: string
}

export interface AttachmentsState {
  attachments: { [key: string]: AttachmentMessage }
}
