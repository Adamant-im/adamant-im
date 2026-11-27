<template>
  <v-dialog
    v-model="show"
    width="var(--a-secondary-dialog-width)"
    :class="className"
    @keydown.enter="onEnter"
  >
    <v-card>
      <v-card-title :class="`${className}__card-title`">
        {{ header }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text :class="`${className}__card-text`">
        <div :class="`${className}__disclaimer`">
          {{ about }}
        </div>

        <div :class="`${className}__disclaimer ${className}__highlight`">
          {{ details }}
        </div>

        <div :class="`${className}__disclaimer`">
          {{ reasons }}
        </div>

        <div :class="`${className}__disclaimer`">
          {{ action }}
        </div>
      </v-card-text>

      <v-col cols="12" :class="`${className}__btn-block`">
        <v-btn :class="[`${className}__btn-hide`, 'a-btn-primary']" @click="hide()">
          <v-icon :class="`${className}__btn-icon`" :icon="mdiAlert" />
          <div :class="`${className}__btn-text`">
            {{ $t('warning_on_addresses.hide_button') }}
          </div>
        </v-btn>
      </v-col>

      <v-col cols="12" :class="`${className}__btn-forget`">
        <a :class="`${className}__action-link`" @click="forget()">
          {{ $t('warning_on_addresses.forget_button') }}
        </a>
      </v-col>
    </v-card>
  </v-dialog>
</template>

<script>
import { mdiAlert } from '@mdi/js'

export default {
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    // Result of the crypto addresses validation, see `src/lib/store-crypto-address.js`
    summary: {
      type: Object,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup() {
    return {
      mdiAlert
    }
  },
  computed: {
    className: () => 'warning-on-addresses-dialog',
    show: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    header() {
      return this.$t('warning_on_addresses.headline')
    },
    about() {
      return this.$t('warning_on_addresses.about')
    },
    details() {
      const summary = this.summary
      let details = ''

      if (summary.isWrongAddress) {
        details = this.$t('warning_on_addresses.specifics_wrong_addresses', {
          crypto: summary.wrongCoin,
          storedAddress: summary.storedAddress,
          correctAddress: summary.correctAddress
        })

        if (summary.wrongCoins.length > 1) {
          details +=
            ' ' +
            this.$t('warning_on_addresses.full_list_wrong_addresses', {
              crypto_list: summary.wrongCoins.join(', ')
            })
        }
      } else if (summary.isManyAddresses) {
        details = this.$t('warning_on_addresses.specifics_many_addresses', {
          crypto: summary.manyAddressesCoin,
          manyAddresses: summary.manyAddresses.join(', ')
        })

        if (summary.manyAddressesCoins.length > 1) {
          details +=
            ' ' +
            this.$t('warning_on_addresses.full_list_many_addresses', {
              crypto_list: summary.manyAddressesCoins.join(', ')
            })
        }
      }

      return details
    },
    reasons() {
      return this.$t('warning_on_addresses.reasons')
    },
    action() {
      return this.$t('warning_on_addresses.what_to_do')
    }
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
@use '@/assets/styles/components/_secondary-dialog.scss' as secondaryDialog;
@use 'vuetify/_settings.scss';

.warning-on-addresses-dialog {
  @include secondaryDialog.a-secondary-dialog-warning-frame();

  &__card-title {
    @include secondaryDialog.a-secondary-dialog-title();
  }

  &__disclaimer {
    @include secondaryDialog.a-secondary-dialog-body-copy();
  }

  &__action-link {
    @include secondaryDialog.a-secondary-dialog-link-action();
  }

  &__highlight {
    background-color: var(--a-color-surface-warning-soft);
  }

  &__btn-block {
    @include secondaryDialog.a-secondary-dialog-action-block();
  }

  &__btn-hide {
    @include secondaryDialog.a-secondary-dialog-primary-action-button();
  }

  &__btn-forget {
    @include secondaryDialog.a-secondary-dialog-footer-link-block();
  }
}
</style>
