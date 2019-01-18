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
  </v-toolbar>
</template>

<script>
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
  props: {
    partnerId: {
      type: String,
      required: true
    }
  }
}
</script>
