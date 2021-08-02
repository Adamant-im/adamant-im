<template>
  <v-dialog
    v-model="show"
    width="500"
  >
    <v-card>
      <v-card-title class="a-text-header">
        {{ $t('login_via_password.popup_title') }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text>
        <v-text-field
          ref="passwordField"
          v-model="password"
          autocomplete="new-password"
          class="a-input"
          type="password"
          :label="$t('login_via_password.enter_password')"
          :name="Date.now()"
          @keyup.enter="submit"
        />

        <div class="a-text-regular-enlarged">
          {{ $t('login_via_password.article_hint') }} <a @click="openLink(userPasswordAgreementLink)">{{ $t('login_via_password.article') }}</a>.
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          flat="flat"
          class="a-btn-regular"
          @click="show = false"
        >
          {{ $t('transfer.confirm_cancel') }}
        </v-btn>

        <v-btn
          flat="flat"
          class="a-btn-regular"
          :disabled="!isValidForm || disabledButton"
          @click="submit"
        >
          <v-progress-circular
            v-show="showSpinner"
            indeterminate
            color="primary"
            size="24"
            class="mr-3"
          />
          {{ $t('login_via_password.popup_confirm_text') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { UserPasswordArticleLink } from '@/lib/constants'
import { saveState } from '@/lib/idb/state'

export default {
  props: {
    value: {
      type: Boolean,
      required: true
    }
  },
  data: () => ({
    password: '',
    showSpinner: false,
    disabledButton: false,
    userPasswordAgreementLink: UserPasswordArticleLink
  }),
  computed: {
    show: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit('input', value)
      }
    },
    isValidForm () {
      return this.password.length > 0
    }
  },
  updated: function () {
    this.$refs.passwordField.focus()
  },
  methods: {
    openLink (link) {
      window.open(link, '_blank', 'resizable,scrollbars,status,noopener')
    },
    submit () {
      if (!this.isValidForm) {
        return
      }
      this.disabledButton = true
      this.showSpinner = true

      this.$store.dispatch('setPassword', this.password)
        .then(encodedPassword => {
          this.password = ''

          this.$emit('password', encodedPassword)

          return encodedPassword
        })
        .then(encodedPassword => {
          return saveState(this.$store)
        })
        .catch(err => {
          console.error(err)
        })
        .finally(() => {
          this.disabledButton = false
          this.showSpinner = false
          this.show = false
        })
    }
  }
}
</script>
