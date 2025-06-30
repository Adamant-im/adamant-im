<template>
  <v-dialog v-model="show" width="500" :class="className" @keydown.enter="onEnter">
    <v-card>
      <v-card-title class="a-text-header">
        {{ header() }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text :class="`${className}__card-text`">
        <div :class="`${className}__disclaimer a-text-regular-enlarged`">
          {{ about() }}
        </div>

        <div :class="`${className}__disclaimer ${className}__highlight a-text-regular-enlarged`">
          {{ details() }}
        </div>

        <div :class="`${className}__disclaimer a-text-regular-enlarged`">
          {{ reasons() }}
        </div>

        <div :class="`${className}__disclaimer a-text-regular-enlarged`">
          {{ action() }}
        </div>
      </v-card-text>

      <v-col cols="12" class="text-center">
        <v-btn :class="[`${className}__btn-hide`, 'a-btn-primary']" @click="hide()">
          <v-icon :class="`${className}__btn-icon`" :icon="mdiAlert" />
          <div :class="`${className}__btn-text`">
            {{ $t('transfer.warning_on_partner_address.hide_button') }}
          </div>
        </v-btn>
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
    info: {
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
    className: () => 'warning-on-partner-address-dialog',
    show: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    }
  },
  methods: {
    header() {
      return this.$t('transfer.warning_on_partner_address.headline')
    },
    about() {
      return this.$t('transfer.warning_on_partner_address.about')
    },
    details() {
      return this.$t('transfer.warning_on_partner_address.specifics_many_addresses', {
        crypto: this.info.coin,
        partner_account: this.info.ADMaddress,
        partner_name: this.info.ADMname,
        manyAddresses: this.info.coinAddresses
      })
    },
    reasons() {
      return this.$t('transfer.warning_on_partner_address.reasons')
    },
    action() {
      return this.$t('transfer.warning_on_partner_address.what_to_do')
    },
    hide() {
      this.show = false
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

.warning-on-partner-address-dialog {
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
}
</style>
