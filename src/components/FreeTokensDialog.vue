<template>
  <v-dialog
    v-model="show"
    width="500"
    :class="className"
    @keydown.enter="onEnter"
  >
    <v-card>
      <v-card-title class="a-text-header">
        {{ $t("chats.free_adm_title") }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text>
        <div :class="`${className}__disclaimer a-text-regular-enlarged`">
          {{ $t("chats.free_adm_disclaimer") }}
        </div>
      </v-card-text>

      <v-flex
        xs12
        class="text-xs-center"
      >
        <v-btn
          :class="[`${className}__btn-free-tokens`, 'a-btn-primary']"
          @click="getFreeTokens()"
        >
          <v-icon :class="`${className}__btn-icon`">
            mdi-gift
          </v-icon>
          <div :class="`${className}__btn-text`">
            {{ $t('home.free_adm_btn') }}
          </div>
        </v-btn>
      </v-flex>

      <v-flex
        xs12
        :class="`${className}__btn-show-article`"
      >
        <a
          class="a-text-active"
          @click="showArticle()"
        >
          {{ $t('chats.how_to_use_messenger') }}
        </a>
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
    }
  },
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
      const link = websiteUriToOnion(this.$t('home.free_tokens_link') + '?wallet=' + this.$store.state.address)
      window.open(link, '_blank', 'resizable,scrollbars,status,noopener')
      this.show = false
    },
    showArticle () {
      const link = this.$t('chats.how_to_use_messenger_link')
      window.open(link, '_blank', 'resizable,scrollbars,status,noopener')
    },
    onEnter () {
      if (this.show) {
        this.getFreeTokens()
      }
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
