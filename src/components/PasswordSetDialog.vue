<template>
  <v-dialog v-model="show" :class="className" width="var(--a-secondary-dialog-width)">
    <v-card>
      <v-card-title :class="`${className}__card-title`">
        {{ t('login_via_password.popup_title') }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text :class="`${className}__body`">
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
              :size="AUTH_FORM_TOGGLE_BUTTON_SIZE"
              variant="plain"
            >
              <v-icon
                :icon="showPassword ? mdiEye : mdiEyeOff"
                :size="AUTH_FORM_TOGGLE_ICON_SIZE"
              />
            </v-btn>
          </template>
        </v-text-field>

        <div :class="`${className}__article-hint`">
          {{ t('login_via_password.article_hint') }}
          <a :class="`${className}__article-link`" @click="openLink(userPasswordAgreementLink)">{{
            t('login_via_password.article')
          }}</a
          >.
        </div>
      </v-card-text>

      <v-card-actions :class="`${className}__actions`">
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
            :size="AUTH_FORM_SUBMIT_SPINNER_SIZE"
            :class="`${className}__submit-spinner`"
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
import { logger } from '@/utils/devTools/logger'
import {
  AUTH_FORM_SUBMIT_SPINNER_SIZE,
  AUTH_FORM_TOGGLE_BUTTON_SIZE,
  AUTH_FORM_TOGGLE_ICON_SIZE
} from '@/components/Login/helpers/uiMetrics'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'password', value: string): void
  (e: 'update:modelValue', value: boolean): void
}>()

const store = useStore()
const { t } = useI18n()
const className = 'password-set-dialog'

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
      logger.log('password-set-dialog', 'warn', err)
    })
    .finally(() => {
      disabledButton.value = false
      showSpinner.value = false
      show.value = false
    })
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/_secondary-dialog.scss' as secondaryDialog;
@use '@/assets/styles/themes/adamant/_mixins.scss' as mixins;

.password-set-dialog {
  @include secondaryDialog.a-secondary-dialog-card-frame();

  &__card-title {
    @include mixins.a-text-header();
  }

  &__article-hint {
    @include mixins.a-text-regular-enlarged();
  }

  &__article-link {
    @include mixins.a-text-active();
  }

  &__submit-spinner {
    margin-inline-end: var(--a-auth-control-inline-gap);
  }
}
</style>
