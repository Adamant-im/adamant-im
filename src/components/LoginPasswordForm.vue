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

      <v-flex xs12 class="mt-2">
        <v-btn flat @click="removePassword">
          {{ $t('login_via_password.remove_password') }}
        </v-btn>
      </v-flex>
    </v-layout>

  </v-form>
</template>

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
