<template>
  <v-toolbar flat height="64">
    <v-btn @click="goBack" icon>
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>

    <div>
      <div v-if="isChatReadOnly" class="title" :style="{ paddingLeft: '12px' }">{{ partnerId }}</div>
      <div v-else>
        <v-text-field
          class="chat-text-field"
          box
          full-width
          background-color="transparent"
          v-model="partnerName"
          :label="partnerId"
        ></v-text-field>
      </div>
    </div>

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

<style lang="stylus">
@import '~vuetify/src/stylus/settings/_variables.styl'

$chat-text-field-font-size := 20px

.chat-text-field.v-text-field
  font-size: $chat-text-field-font-size

  .v-label
    max-width: unset
    font-size: $chat-text-field-font-size
  .v-input__control
    padding: 0
  .v-input__control > .v-input__slot
    padding: 0
    margin-bottom: 0
  .v-label--active
    transform: translateY(-6px) scale(0.6875)

/** Themes **/
.theme--light
  .chat-text-field.v-text-field
    .primary--text
      color: $grey.darken-1 !important
    .v-label
      color: $grey.darken-4
    .v-label--active
      color: $grey.darken-1
.theme--dark
  .chat-text-field.v-text-field
    .primary--text
      color: $shades.white !important
    .v-label
      color: $shades.white
    .v-label--active
      color: $shades.white
</style>
