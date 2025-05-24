<template>
  <v-dialog v-model="show" width="500">
    <v-card>
      <v-card-title class="a-text-header">
        {{ t('login_via_password.popup_title') }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text class="pa-4">
        <!--     Todo: check src/components/LoginForm.vue component and consider the possibility to move common code to new component  -->
        <v-text-field
          v-model="password"
          color="primary"
          autofocus
          autocomplete="new-password"
          class="a-input"
          :type="showPassword ? 'text' : 'password'"
          variant="underlined"
          :label="t('login_via_password.enter_password')"
          :name="Date.now().toString()"
          @keyup.enter="submit"
        >
          <template #append-inner>
            <v-btn
              @click="togglePasswordVisibility"
              icon
              :ripple="false"
              :size="28"
              variant="plain"
            >
              <v-icon :icon="showPassword ? mdiEye : mdiEyeOff" :size="24" />
            </v-btn>
          </template>
        </v-text-field>

        <div class="a-text-regular-enlarged">
          {{ t('login_via_password.article_hint') }}
          <a @click="openLink(userPasswordAgreementLink)">{{ t('login_via_password.article') }}</a
          >.
        </div>
      </v-card-text>

      <v-card-actions class="pa-3">
        <v-spacer />

        <v-btn variant="text" class="a-btn-regular" @click="show = false">
          {{ t('transfer.confirm_cancel') }}
        </v-btn>

        <v-btn
          variant="text"
          class="a-btn-regular"
          :disabled="!isValidForm || disabledButton"
          @click="submit"
        >
          <v-progress-circular
            v-show="showSpinner"
            indeterminate
            color="primary"
            size="24"
            class="mr-4"
          />
          {{ t('login_via_password.popup_confirm_text') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { mdiEye, mdiEyeOff } from '@mdi/js'
import { useI18n } from 'vue-i18n'

import { UserPasswordArticleLink } from '@/lib/constants'
import { saveState } from '@/lib/idb/state'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'password', value: string): void
  (e: 'update:modelValue', value: boolean): void
}>()

const store = useStore()
const { t } = useI18n()

const password = ref('')
const showSpinner = ref(false)
const disabledButton = ref(false)
const showPassword = ref(false)
const userPasswordAgreementLink = UserPasswordArticleLink

const show = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
  }
})

const isValidForm = computed(() => password.value.length > 0)

const openLink = (link: string) => {
  window.open(link, '_blank', 'resizable,scrollbars,status,noopener')
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const submit = () => {
  if (!isValidForm.value) return

  disabledButton.value = true
  showSpinner.value = true

  store
    .dispatch('setPassword', password.value)
    .then((encodedPassword) => {
      password.value = ''
      emit('password', encodedPassword)

      return encodedPassword
    })
    .then(() => saveState(store))
    .catch((err) => {
      console.error(err)
    })
    .finally(() => {
      disabledButton.value = false
      showSpinner.value = false
      show.value = false
    })
}
</script>
