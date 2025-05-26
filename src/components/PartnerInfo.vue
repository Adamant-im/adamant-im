<template>
  <v-dialog v-model="show" max-width="360">
    <v-card>
      <v-card-title :class="`${className}__dialog-title`" class="a-text-header">
        {{ isMe ? t('chats.my_qr_code') : t('chats.partner_info') }}
        <v-spacer />
        <v-btn variant="text" icon class="close-icon" :size="36" @click="show = false">
          <v-icon :icon="mdiClose" :size="24" />
        </v-btn>
      </v-card-title>
      <v-divider class="a-divider" />
      <v-list lines="two">
        <v-list-item>
          <template #prepend>
            <icon-box>
              <ChatAvatar :user-id="address" use-public-key />
            </icon-box>
          </template>
          <v-list-item-title :class="`${className}__address`">
            {{ address }}
          </v-list-item-title>
          <v-list-item-subtitle :class="`${className}__username`">
            {{ isMe ? t('chats.me') : name }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
      <v-row align="center" justify="center" class="pb-6" no-gutters>
        <QrcodeRenderer :logo="logo" :opts="opts" :text="text" />
      </v-row>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import ChatAvatar from '@/components/Chat/ChatAvatar.vue'
import QrcodeRenderer from '@/components/QrcodeRenderer.vue'
import { Cryptos } from '@/lib/constants'
import { generateURI } from '@/lib/uri'
import validateAddress from '@/lib/validateAddress'
import { isStringEqualCI } from '@/lib/textHelpers'
import IconBox from '@/components/icons/IconBox.vue'
import { mdiClose } from '@mdi/js'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  address: {
    type: String,
    required: true,
    validator: (v: string) => validateAddress('ADM', v)
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
    validator: (v: string) => validateAddress('ADM', v)
  }
})
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { t } = useI18n()

const className = 'partner-info-dialog'
const logo = '/img/adm-qr-invert.png'
const opts = { scale: 8.8 }

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isMe = computed(() => isStringEqualCI(props.address, props.ownerAddress))

const text = computed(() =>
  isMe.value
    ? generateURI(Cryptos.ADM, props.ownerAddress)
    : generateURI(Cryptos.ADM, props.address, props.name)
)
</script>
<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/_settings.scss';

.partner-info-dialog {
  &__dialog-title {
    display: flex;
    align-items: center;
  }
}

.close-icon {
  margin: 0;
}

.v-theme--dark {
  .partner-info-dialog {
    &__dialog-title {
      color: map.get(settings.$shades, 'white');
    }

    &__address {
      color: map.get(settings.$shades, 'white');
    }

    &__username {
      color: map.get(colors.$adm-colors, 'grey-transparent');
    }
  }
}
</style>
