<template>
  <v-layout
    justify-center
    row
  >
    <v-dialog
      v-model="show"
      max-width="360"
    >
      <v-card>
        <v-card-title class="a-text-header">
          {{ isMe ? $t('chats.my_qr_code') : $t('chats.partner_info') }}
          <v-spacer />
          <v-btn
            flat
            icon
            class="close-icon"
            @click="show = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider class="a-divider" />
        <v-list two-line>
          <template>
            <v-list-tile>
              <v-list-tile-avatar>
                <ChatAvatar
                  :user-id="address"
                  use-public-key
                />
              </v-list-tile-avatar>
              <v-list-tile-content>
                <v-list-tile-title v-text="address" />
                <v-list-tile-sub-title v-text="isMe ? $t('chats.me') : name" />
              </v-list-tile-content>
            </v-list-tile>
          </template>
        </v-list>
        <v-layout
          align-center
          justify-center
          class="pb-4"
        >
          <QrcodeRenderer
            :logo="logo"
            :opts="opts"
            :text="text"
          />
        </v-layout>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>
import ChatAvatar from '@/components/Chat/ChatAvatar'
import QrcodeRenderer from '@/components/QrcodeRenderer'
import { Cryptos } from '@/lib/constants'
import { generateURI } from '@/lib/uri'
import validateAddress from '@/lib/validateAddress'
import { isStringEqualCI } from '@/lib/textHelpers'

export default {
  components: {
    ChatAvatar, QrcodeRenderer
  },
  props: {
    address: {
      type: String,
      required: true,
      validator: v => validateAddress('ADM', v)
    },
    name: {
      type: String,
      default: ''
    },
    value: {
      type: Boolean,
      required: true
    },
    ownerAddress: {
      type: String,
      required: true,
      validator: v => validateAddress('ADM', v)
    }
  },
  data () {
    return {
      logo: '/img/adm-qr-invert.png',
      opts: {
        scale: 8.8
      }
    }
  },
  computed: {
    show: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit('input', value)
      }
    },
    text () {
      return this.isMe
        ? generateURI(Cryptos.ADM, this.ownerAddress)
        : generateURI(Cryptos.ADM, this.address, this.name)
    },
    isMe () {
      return isStringEqualCI(this.address, this.ownerAddress)
    }
  }
}
</script>
<style lang="stylus" scoped>
.close-icon
  margin: 0
</style>
