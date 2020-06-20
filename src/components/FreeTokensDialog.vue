<template>
  <v-dialog
    v-model="show"
    width="500"
    :class="className"
  >
    <v-card>
      <v-card-title class="a-text-header">
        {{ $t("home.free_adm_title") }}
      </v-card-title>

      <v-divider class="a-divider"></v-divider>

      <v-card-text>
        <div :class="`${className}__disclaimer a-text-regular-enlarged`">
          {{ $t("home.free_adm_disclaimer") }}
        </div>
      </v-card-text>

      <v-flex xs12 class="text-xs-center">
        <v-btn :class="[`${className}__btn-free-tokens`, 'a-btn-primary']"
          @click="getFreeTokens()"
        >
          <v-icon :class="`${className}__btn-icon`">mdi-gift</v-icon>
          <div :class="`${className}__btn-text`">{{ $t('home.free_adm_btn') }}</div>
        </v-btn>
      </v-flex>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  computed: {
    className: () => 'free-tokens-dialog',
    show: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit('input', value)
      }
    }
  },
  methods: {
    getFreeTokens () {
      const link = 'https://adamant.im/free-adm-tokens/?wallet=' + this.$store.state.address
      window.open(link, '_blank', 'resizable,scrollbars,status,noopener')
      this.show = false
    }
  },
  props: {
    value: {
      type: Boolean,
      required: true
    }
  }
}
</script>
<style lang="stylus" scoped>
  .free-tokens-dialog
    $__disclaimer
      margin-top: 10px
    &__btn-free-tokens
      margin-top: 10px
      margin-bottom: 30px
    &__btn-icon
      margin-right: 8px
</style>
