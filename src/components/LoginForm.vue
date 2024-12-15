<template>
  <v-form ref="form" class="login-form" @submit.prevent="submit">
    <v-row no-gutters>
      <slot>
        <v-text-field
          v-model="passphrase"
          :label="$t('login.password_label')"
          autocomplete="current-password"
          class="text-center"
          color="white"
          :type="showPassphrase ? 'text' : 'password'"
          variant="underlined"
        >
          <template #append-inner>
            <v-btn
              @click="togglePassphraseVisibility"
              icon
              :ripple="false"
              :size="28"
              variant="plain"
            >
              <v-icon :icon="showPassphrase ? 'mdi-eye' : 'mdi-eye-off'" :size="24" />
            </v-btn>
          </template>
        </v-text-field>
      </slot>

      <slot name="append-outer" />
    </v-row>

    <v-row align="center" justify="center" no-gutters>
      <slot name="button">
        <v-btn class="login-form__button a-btn-primary" @click="submit">
          <v-progress-circular
            v-show="showSpinner"
            indeterminate
            color="primary"
            size="24"
            class="mr-4"
          />
          {{ $t('login.login_button') }}
        </v-btn>
      </slot>
    </v-row>

    <transition name="slide-fade">
      <v-row justify="center" no-gutters>
        <slot name="qrcode-renderer" />
      </v-row>
    </transition>
  </v-form>
</template>

<script>
import { validateMnemonic } from 'bip39'
import { computed, ref, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import { isAllNodesOfflineError, isAllNodesDisabledError } from '@/lib/nodes/utils/errors'

export default defineComponent({
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['login', 'error', 'update:modelValue'],
  setup(props, { emit }) {
    const router = useRouter()
    const store = useStore()
    const { t } = useI18n()
    const showSpinner = ref(false)

    const showPassphrase = ref(false)
    const togglePassphraseVisibility = () => {
      showPassphrase.value = !showPassphrase.value
    }

    const passphrase = computed({
      get() {
        return props.modelValue
      },
      set(value) {
        emit('update:modelValue', value)
      }
    })

    const isOnline = computed(() => store.getters['isOnline'])

    const admNodes = computed(() => store.getters['nodes/adm'])
    const activeOnlineAdmNode = admNodes.value.some(node => node.active && node.online)

    const submit = () => {
      if (!validateMnemonic(passphrase.value)) {
        return emit('error', t('login.invalid_passphrase'))
      }
      freeze()
      login()
    }
    const login = () => {
      const promise = store.dispatch('login', passphrase.value)
      promise
        .then(() => {
          emit('login')
        })
        .catch((err) => {
          if (!isOnline.value) {
            emit('error', t('connection.offline'))
            router.push({ name: 'Nodes' })
          } else if (isAxiosError(err)) {
            emit('error', t('login.invalid_passphrase'))
          } else if (activeOnlineAdmNode) {
            router.push({ name: 'Home' })
          } else if (isAllNodesOfflineError(err)) {
            emit('error', t('errors.all_nodes_offline', { crypto: err.nodeLabel.toUpperCase() }))
          } else if (isAllNodesDisabledError(err)) {
            emit('error', t('errors.all_nodes_disabled', { crypto: err.nodeLabel.toUpperCase() }))
            router.push({ name: 'Nodes' })
          } else {
            emit('error', t('errors.something_went_wrong'))
          }
          console.log(err)
        })
        .finally(() => {
          antiFreeze()
        })

      return promise
    }
    const freeze = () => {
      showSpinner.value = true
    }
    const antiFreeze = () => {
      showSpinner.value = false
    }

    return {
      showSpinner,
      passphrase,
      showPassphrase,
      togglePassphraseVisibility,
      submit,
      freeze,
      antiFreeze,
      login,
      admNodes
    }
  }
})
</script>
