export interface AttachmentsState {
  /**
   * Record<CID, URL>
   */
  attachments: { [cid: string]: string }
  /**
   * Stores upload progress of a file in %
   */
  uploadProgress: { [cid: string]: number }
  /**
   * Stores download progress of a file in %
   */
  downloadProgress: { [cid: string]: number }
}
