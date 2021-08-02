<template>
  <v-form
    ref="form"
    v-model="validForm"
    class="login-form"
    @submit.prevent="submit"
  >
    <v-layout>
      <v-text-field
        ref="passwordField"
        v-model="password"
        autocomplete="new-password"
        :label="$t('login_via_password.user_password_title')"
        :name="Date.now()"
        type="password"
        class="text-xs-center"
      />
    </v-layout>

    <v-layout
      row
      wrap
      align-center
      justify-center
      class="mt-2"
    >
      <v-flex xs12>
        <slot name="button">
          <v-btn
            :disabled="!validForm || disabledButton"
            class="login-form__button a-btn-primary"
            @click="submit"
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
      <v-flex
        xs12
        class="a-text-regular mt-5"
      >
        {{ $t('login_via_password.remove_password_hint') }}
      </v-flex>
      <v-flex xs12>
        <v-btn
          class="a-btn-link"
          flat
          small
          @click="removePassword"
        >
          {{ $t('login_via_password.remove_password') }}
        </v-btn>
      </v-flex>
    </v-layout>
  </v-form>
</template>

<script>
import { clearDb } from '@/lib/idb'

export default {
  props: {
    value: {
      type: String,
      default: ''
    }
  },
  data: () => ({
    validForm: true,
    disabledButton: false,
    showSpinner: false
  }),
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
  updated () {
    this.$refs.passwordField.focus()
  },
  methods: {
    submit () {
      this.showSpinner = true
      this.disabledButton = true

      return this.$store.dispatch('loginViaPassword', this.password)
        .then(() => {
          this.$emit('login')
        })
        .catch(() => {
          this.$emit('error', 'login_via_password.incorrect_password')
        })
        .finally(() => {
          this.showSpinner = false
          this.disabledButton = false
        })
    },
    removePassword () {
      clearDb().finally(() => {
        this.$store.dispatch('removePassword')
      })
    }
  }
}
</script>
