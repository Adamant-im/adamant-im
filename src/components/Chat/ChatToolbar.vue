<template>
  <v-toolbar flat height="64">
    <v-btn @click="goBack" icon>
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>

    <v-toolbar-title>
      <div v-if="isChatReadOnly">{{ partnerId }}</div>
      <v-edit-dialog v-else>
        <div>{{ partnerName ? partnerName : partnerId }}</div>
        <v-text-field
          v-model="partnerName"
          slot="input"
          :label="$t('chats.partner_name')"
          single-line
        />
      </v-edit-dialog>

      <div class="body-1" v-if="partnerName">{{ partnerId }}</div>
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <chat-menu
      v-if="!isChatReadOnly"
      :partner-id="partnerId"
    />

  </v-toolbar>
</template>

<script>
import { debounce } from 'underscore'

import ChatMenu from '@/components/Chat/ChatMenu'

/**
 * Update contact name no more than every 2 seconds.
 * @param {string} Contact name
 * @type {Function} Debounce
 */
let updateContactName = debounce(function (name) {
  this.$store.dispatch('contacts/updateName', {
    userId: this.partnerId,
    name
  })
}, 2000)

export default {
  computed: {
    partnerName: {
      get () {
        return this.$store.getters['contacts/contactName'](this.partnerId)
      },
      set (value) {
        updateContactName.call(this, value)
      }
    },
    isChatReadOnly () {
      return this.$store.getters['chat/isChatReadOnly'](this.partnerId)
    }
  },
  methods: {
    goBack () {
      this.$router.back()
    }
  },
  components: {
    ChatMenu
  },
  props: {
    partnerId: {
      type: String,
      required: true
    }
  }
}
</script>
