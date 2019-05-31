<template>
  <v-form v-model="validForm" @submit.prevent="submit" ref="form" class="login-form">

    <v-layout>
      <v-text-field
        autocomplete="new-password"
        v-model="password"
        :label="$t('login_via_password.user_password_title')"
        :name="Date.now()"
        type="password"
        class="text-xs-center"
        ref="passwordField"
      />
    </v-layout>

    <v-layout row wrap align-center justify-center class="mt-2">
      <v-flex xs12>
        <slot name="button">
          <v-btn
            :disabled="!validForm || disabledButton"
            @click="submit"
            class="login-form__button a-btn-primary"
          >
            <v-progress-circular
              v-show="showSpinner"
              indeterminate
              color="primary"
              size="24"
              class="mr-3"
            />
            {{ $t('login_via_password.user_password_unlock') }}
          </v-btn>
        </slot>
      </v-flex>
      <v-flex xs12 class=" a-text-regular password-hint">
        {{ $t('login_via_password.remove_password_hint') }}
      </v-flex>
      <v-flex xs12>
        <v-btn class="a-btn-link" flat small @click="removePassword">
          {{ $t('login_via_password.remove_password') }}
        </v-btn>
      </v-flex>
    </v-layout>

  </v-form>
</template>

<style lang="stylus" scoped>
.password-hint
  margin-top: 48px
</style>

<script>
import { clearDb } from '@/lib/idb'

export default {
  computed: {
    password: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit('input', value)
      }
    }
  },
  updated: function () {
    this.$refs.passwordField.focus()
  },
  data: () => ({
    validForm: true,
    disabledButton: false,
    showSpinner: false
  }),
  methods: {
    submit () {
      return this.$store.dispatch('loginViaPassword', this.password)
        .then(() => {
          this.$emit('login')
        })
        .catch(() => {
          this.$emit('error', 'login_via_password.incorrect_password')
        })
    },
    removePassword () {
      clearDb().finally(() => {
        this.$store.dispatch('removePassword')
      })
    }
  },
  props: {
    value: {
      type: String,
      default: ''
    }
  }
}
</script>
