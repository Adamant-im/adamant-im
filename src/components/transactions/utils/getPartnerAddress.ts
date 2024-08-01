/**
 * Get the partner address based on the sender and recipient addresses.
 */
export function getPartnerAddress(senderId: string, recipientId: string, mineAddress: string) {
  return senderId === mineAddress ? recipientId : senderId
}
