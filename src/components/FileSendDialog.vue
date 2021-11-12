<template>
  <v-dialog
    v-model="show"
    width="500"
    :class="className"
    @keydown.enter="onEnter"
  >
    <v-card>
      <v-card-title class="a-text-header">
        {{ $t(`chats.${titleKey}`) }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text>

          <div v-if="assetType === 'image'">
               <img :src="`data:image/png;base64,${imageBase64}`" />
          </div>
   
        <v-text-field
            ref="partnerField"
            v-model="fileComment"
            class="a-input"
            :label="$t('chats.recipient')"
            :title="$t('chats.recipient_tooltip')"
            >

      </v-card-text>

      <v-flex
        xs12
        class="text-xs-center"
      >
        <v-btn
          :class="[`${className}__btn-free-tokens`, 'a-btn-primary']"
          @click="sendFile()"
        >
          <v-icon :class="`${className}__btn-icon`">
            mdi-send
          </v-icon>
          <div :class="`${className}__btn-text`">
            {{ $t('home.file_dialog_button') }}
          </div>
        </v-btn>
      </v-flex>


    </v-card>
  </v-dialog>
</template>

<script>
import { websiteUriToOnion } from '@/lib/uri'

export default {
  props: {
    value: {
      type: Boolean,
      required: true
    },
    assetType: {
      type: String,
      required: true
    },
    imageBase64: {
      type: String,
    },
  },
  data: () => ({
      fileComment: '',
      isImage: false
  }),
  computed: {
    className: () => 'send-file-dialog',
    show: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit('input', value)
      }
    },
    titleKey: () =>  this.assetType === 'file' ? 'file_send_title' : 'file_image_title'
  },
  methods: {
    onEnter () {
      if (this.show) {
        this.sendFile()
      }
    },
    sendFile(){

    }
  }
}
</script>
<style lang="stylus" scoped>
  .free-tokens-dialog
    &__disclaimer
      margin-top: 10px
    &__btn-free-tokens
      margin-top: 15px
      margin-bottom: 20px
    &__btn-icon
      margin-right: 8px
    &__btn-show-article
      padding-bottom: 30px
      text-align: center
</style>
