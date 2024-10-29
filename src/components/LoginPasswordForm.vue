<template>
  <v-form ref="form" class="login-form" @submit.prevent="submit">
    <v-row no-gutters>
      <v-text-field
        ref="passwordField"
        v-model="password"
        autofocus
        autocomplete="new-password"
        :label="$t('login_via_password.user_password_title')"
        :name="Date.now()"
        type="password"
        class="text-center"
        variant="underlined"
      />
    </v-row>

    <v-row align="center" justify="center" class="mt-2" no-gutters>
      <v-col cols="12">
        <slot name="button">
          <v-btn class="login-form__button a-btn-primary" @click="submit">
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
      <v-col cols="12" class="a-text-regular mt-8">
        {{ $t('login_via_password.remove_password_hint') }}
      </v-col>
      <v-col cols="12">
        <v-btn class="a-btn-link" variant="text" size="small" @click="removePassword">
          {{ $t('login_via_password.remove_password') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>

<script>
import { clearDb } from '@/lib/idb'
import { computed, defineComponent, ref } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['login', 'error', 'update:modelValue'],
  setup(props, { emit }) {
    const store = useStore()
    const { t } = useI18n()
    const passwordField = ref(null)
    const showSpinner = ref(false)

    const password = computed({
      get() {
        return props.modelValue
      },
      set(value) {
        emit('update:modelValue', value)
      }
    })

    const submit = () => {
      showSpinner.value = true

      return store
        .dispatch('loginViaPassword', password.value)
        .then(() => {
          emit('login')
        })
        .catch(() => {
          emit('error', t('login_via_password.incorrect_password'))
        })
        .finally(() => {
          showSpinner.value = false
        })
    }

    const removePassword = () => {
      clearDb().finally(() => {
        store.dispatch('removePassword')
      })
    }

    return {
      passwordField,
      showSpinner,
      password,
      submit,
      removePassword
    }
  }
})
</script>
