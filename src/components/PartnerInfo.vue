<template>
  <v-dialog
    v-model="show"
    max-width="360"
  >
    <v-card>
      <v-card-title class="a-text-header">
        {{ isMe ? $t('chats.my_qr_code') : $t('chats.partner_info') }}
        <v-spacer />
        <v-btn
          variant="text"
          icon
          class="close-icon"
          @click="show = false"
        >
          <v-icon icon="mdi-close" />
        </v-btn>
      </v-card-title>
      <v-divider class="a-divider" />
      <v-list lines="two">
        <v-list-item>
          <template #prepend>
            <icon-box>
              <ChatAvatar
                :user-id="address"
                use-public-key
              />
            </icon-box>
          </template>
          <v-list-item-title v-text="address" />
          <v-list-item-subtitle v-text="isMe ? $t('chats.me') : name" />
        </v-list-item>
      </v-list>
      <v-row
        align="center"
        justify="center"
        class="pb-6"
        no-gutters
      >
        <QrcodeRenderer
          :logo="logo"
          :opts="opts"
          :text="text"
        />
      </v-row>
    </v-card>
  </v-dialog>
</template>

<script>
import ChatAvatar from '@/components/Chat/ChatAvatar'
import QrcodeRenderer from '@/components/QrcodeRenderer'
import { Cryptos } from '@/lib/constants'
import { generateURI } from '@/lib/uri'
import validateAddress from '@/lib/validateAddress'
import { isStringEqualCI } from '@/lib/textHelpers'
import IconBox from '@/components/icons/IconBox'

export default {
  components: {
    IconBox,
    ChatAvatar,
    QrcodeRenderer
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
    modelValue: {
      type: Boolean,
      required: true
    },
    ownerAddress: {
      type: String,
      required: true,
      validator: v => validateAddress('ADM', v)
    }
  },
  emits: ['update:modelValue'],
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
        return this.modelValue
      },
      set (value) {
        this.$emit('update:modelValue', value)
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
<style lang="scss" scoped>
.close-icon {
  margin: 0;
}
</style>
