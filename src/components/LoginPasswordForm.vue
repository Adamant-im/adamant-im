<template>
  <v-form
    ref="form"
    v-model="validForm"
    class="login-form"
    @submit.prevent="submit"
  >
    <v-row no-gutters>
      <v-text-field
        ref="passwordField"
        v-model="password"
        autocomplete="new-password"
        :label="$t('login_via_password.user_password_title')"
        :name="Date.now()"
        type="password"
        class="text-center"
      />
    </v-row>

    <v-row
      align="center"
      justify="center"
      class="mt-2"
      no-gutters
    >
      <v-col cols="12">
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
              class="mr-4"
            />
            {{ $t('login_via_password.user_password_unlock') }}
          </v-btn>
        </slot>
      </v-col>
      <v-col
        cols="12"
        class="a-text-regular mt-8"
      >
        {{ $t('login_via_password.remove_password_hint') }}
      </v-col>
      <v-col cols="12">
        <v-btn
          class="a-btn-link"
          text
          small
          @click="removePassword"
        >
          {{ $t('login_via_password.remove_password') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>

<script>
import { clearDb } from '@/lib/idb'

export default {
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['login', 'error'],
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
        this.$emit('update:modelValue', value)
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
