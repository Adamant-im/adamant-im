export default {
  methods: {
    /**
     * Returns partner name for the specified ADM address. Localized name is
     * returned for the ADM system chats.
     * @param {string} address partner ADM address
     */
    getPartnerName (address) {
      const name = this.$store.getters['partners/displayName'](address) || ''
      const isAdmChat = this.$store.getters['chat/isAdamantChat'](address)
      return isAdmChat ? this.$t(name) : name
    }
  }
}
