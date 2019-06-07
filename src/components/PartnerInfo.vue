<template>
  <v-layout justify-center row>
    <v-dialog max-width="360" v-model="show">
      <v-card>
        <v-card-title class="a-text-header">
          {{ $t('chats.partner_info') }}
          <v-spacer></v-spacer>
          <v-btn @click="show = false" flat icon class="close-icon">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider class="a-divider"></v-divider>
        <v-list two-line>
          <template>
            <v-list-tile>
              <v-list-tile-avatar>
                <ChatAvatar :user-id="address" use-public-key />
              </v-list-tile-avatar>
              <v-list-tile-content>
                <v-list-tile-title v-html="address"></v-list-tile-title>
                <v-list-tile-sub-title v-html="name"></v-list-tile-sub-title>
              </v-list-tile-content>
            </v-list-tile>
          </template>
        </v-list>
        <v-layout align-center justify-center class="pb-4">
          <QrcodeRenderer :logo="logo" :opts="opts" :text="text" />
        </v-layout>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>
import ChatAvatar from '@/components/Chat/ChatAvatar'
import QrcodeRenderer from '@/components/QrcodeRenderer'

export default {
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
      return `adm:${this.address}${this.name ? '?label=' + this.name : ''}`
    }
  },
  data () {
    return {
      logo: '/img/adamant-logo-transparent-512x512.png',
      opts: {
        scale: 8.8
      }
    }
  },
  components: {
    ChatAvatar, QrcodeRenderer
  },
  props: {
    address: {
      required: true,
      type: String
    },
    name: {
      type: String
    },
    value: {
      default: false,
      type: Boolean
    }
  }
}
</script>
<style lang="stylus"  scoped>
.close-icon
  margin: 0
</style>
