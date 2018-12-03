<template>
  <v-toolbar flat height="64">
    <v-btn @click="goBack" icon>
      <v-icon>arrow_back</v-icon>
    </v-btn>

    <v-toolbar-title>
      <v-edit-dialog lazy>
        <div>{{ displayName ? displayName : partnerId }}</div>
        <v-text-field
          v-model="displayName"
          slot="input"
          :label="$t('partnerName')"
          single-line
        />
      </v-edit-dialog>

      <div class="body-1" v-if="displayName">{{ partnerId }}</div>
    </v-toolbar-title>

    <v-spacer></v-spacer>

  </v-toolbar>
</template>

<script>
export default {
  computed: {
    partnerId () {
      return this.$route.params.partner
    },
    partnerName () {
      return this.$store.state.partnerName
    },
    displayName: {
      get () {
        return this.$store.getters['partners/displayName'](this.$store.state.partnerName)
      },
      set (value) {
        this.$store.commit('partners/displayName', {
          partner: this.partnerName,
          displayName: value
        })
      }
    }
  },
  methods: {
    goBack () {
      this.$router.back()
    }
  }
}
</script>

<i18n>
{
  "en": {
    "partnerName": "Partner name"
  },
  "ru": {
    "partnerName": "Имя собеседника"
  }
}
</i18n>
