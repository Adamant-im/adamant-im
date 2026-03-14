<template>
  <v-dialog
    v-model="show"
    width="var(--a-secondary-dialog-width)"
    :class="className"
    @keydown.enter="onEnter"
  >
    <v-card>
      <v-card-title :class="`${className}__card-title`">
        {{ header() }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text :class="`${className}__card-text`">
        <div :class="`${className}__disclaimer`">
          {{ about() }}
        </div>

        <div :class="`${className}__disclaimer ${className}__highlight`">
          {{ details() }}
        </div>

        <div :class="`${className}__disclaimer`">
          {{ reasons() }}
        </div>

        <div :class="`${className}__disclaimer`">
          {{ action() }}
        </div>
      </v-card-text>

      <v-col cols="12" :class="`${className}__btn-block`">
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
@use '@/assets/styles/components/_secondary-dialog.scss' as secondaryDialog;
@use 'vuetify/_settings.scss';

.warning-on-partner-address-dialog {
  @include secondaryDialog.a-secondary-dialog-warning-frame();

  &__card-title {
    @include secondaryDialog.a-secondary-dialog-title();
  }

  &__disclaimer {
    @include secondaryDialog.a-secondary-dialog-body-copy();
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
}
</style>
