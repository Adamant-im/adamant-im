<template>
  <v-toolbar flat height="64">
    <v-btn @click="goBack" icon>
      <v-icon>arrow_back</v-icon>
    </v-btn>

    <v-toolbar-title>
      <v-edit-dialog lazy>
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
import ChatMenu from '@/components/Chat/ChatMenu'

export default {
  computed: {
    partnerName: {
      get () {
        return this.$store.getters['partners/displayName'](this.partnerId)
      },
      set (value) {
        this.$store.commit('partners/displayName', {
          partner: this.partnerId,
          displayName: value
        })
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
