<template>
  <v-dialog
    v-model="show"
    width="500"
  >
    <v-card>
      <v-card-title class="headline">{{ $t('login_via_password.popup_title') }}</v-card-title>

      <v-card-text>
        <v-text-field
          autocomplete="new-password"
          v-model="password"
          type="password"
          :label="$t('login_via_password.enter_password')"
          :name="Date.now()"
        />

        <div>{{ $t('login_via_password.article_hint') }} <a :href="userPasswordAgreementLink">{{$t('login_via_password.article')}}</a></div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn
          flat="flat"
          @click="show = false"
        >
          {{ $t('transfer.confirm_cancel') }}
        </v-btn>

        <v-btn
          flat="flat"
          @click="submit"
          :disabled="!isValidForm || disabledButton"
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
  methods: {
    submit () {
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
  },
  props: {
    value: {
      type: Boolean,
      required: true
    }
  }
}
</script>
