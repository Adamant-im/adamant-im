export interface AttachmentsState {
  /**
   * Record<CID, URL>
   */
  attachments: { [cid: string]: string }
}
