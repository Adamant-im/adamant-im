<template>
  <v-dialog v-model="show" width="500" :class="className" @keydown.enter="onEnter">
    <v-card>
      <v-card-title class="a-text-header">
        {{ header }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text :class="`${className}__card-text`">
        <div :class="`${className}__disclaimer a-text-regular-enlarged`">
          {{ about }}
        </div>

        <div :class="`${className}__disclaimer ${className}__highlight a-text-regular-enlarged`">
          {{ details }}
        </div>

        <div :class="`${className}__disclaimer a-text-regular-enlarged`">
          {{ reasons }}
        </div>

        <div :class="`${className}__disclaimer a-text-regular-enlarged`">
          {{ action }}
        </div>
      </v-card-text>

      <v-col cols="12" class="text-center pa-0">
        <v-btn :class="[`${className}__btn-hide`, 'a-btn-primary']" @click="hide()">
          <v-icon :class="`${className}__btn-icon`" :icon="mdiAlert" />
          <div :class="`${className}__btn-text`">
            {{ $t('warning_on_addresses.hide_button') }}
          </div>
        </v-btn>
      </v-col>

      <v-col cols="12" :class="`${className}__btn-forget`">
        <a class="a-text-active" @click="forget()">
          {{ $t('warning_on_addresses.forget_button') }}
        </a>
      </v-col>
    </v-card>
  </v-dialog>
</template>

<script>
import { vueBus } from '@/lib/vueBus'
import { mdiAlert } from '@mdi/js'

export default {
  props: {
    modelValue: {
      type: Boolean,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup() {
    return {
      mdiAlert
    }
  },
  data: () => ({
    header: '',
    content: ''
  }),
  computed: {
    className: () => 'warning-on-addresses-dialog',
    show: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    }
  },
  created() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const dialog = this

    vueBus.on('warningOnAddressDialog', function (validateSummary) {
      if (!validateSummary.isAllRight) {
        dialog.header = dialog.$t('warning_on_addresses.headline')

        dialog.about = dialog.$t('warning_on_addresses.about')

        if (validateSummary.isWrongAddress) {
          dialog.details = dialog.$t('warning_on_addresses.specifics_wrong_addresses', {
            crypto: validateSummary.wrongCoin,
            storedAddress: validateSummary.storedAddress,
            correctAddress: validateSummary.correctAddress
          })

          if (validateSummary.wrongCoins.length > 1) {
            const wrongCoins = validateSummary.wrongCoins.join(', ')
            dialog.details +=
              ' ' +
              dialog.$t('warning_on_addresses.full_list_wrong_addresses', {
                crypto_list: wrongCoins
              })
          }
        } else if (validateSummary.isManyAddresses) {
          const manyAddresses = validateSummary.manyAddresses.join(', ')

          dialog.details = dialog.$t('warning_on_addresses.specifics_many_addresses', {
            crypto: validateSummary.manyAddressesCoin,
            manyAddresses: manyAddresses
          })

          if (validateSummary.manyAddressesCoins.length > 1) {
            const wrongCoins = validateSummary.manyAddressesCoins.join(', ')
            dialog.details +=
              ' ' +
              dialog.$t('warning_on_addresses.full_list_many_addresses', {
                crypto_list: wrongCoins
              })
          }
        }

        dialog.reasons = dialog.$t('warning_on_addresses.reasons')
        dialog.action = dialog.$t('warning_on_addresses.what_to_do')

        dialog.show = true
      }
    })
  },
  methods: {
    hide() {
      this.show = false
    },
    forget() {
      this.$store.commit('options/updateOption', {
        key: 'suppressWarningOnAddressesNotification',
        value: true
      })
      this.hide()
    },
    onEnter() {
      if (this.show) {
        this.hide()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/_settings.scss';

.warning-on-addresses-dialog {
  &__card-text {
    padding: 16px !important;
  }
  &__disclaimer {
    margin-top: 10px;
  }
  &__highlight {
    background-color: rgba(map.get(colors.$adm-colors, 'attention'), 0.6);
    padding: 10px;
  }
  &__btn-icon {
    margin-right: 8px;
  }
  &__btn-hide {
    margin-top: 15px;
    margin-bottom: 20px;
  }
  &__btn-forget {
    padding: 0 0 30px 0;
    text-align: center;
  }
}
</style>
