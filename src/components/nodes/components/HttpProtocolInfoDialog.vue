<template>
  <v-dialog v-model="show" width="500">
    <v-card>
      <v-card-title class="a-text-header">
        {{ t('nodes.popup.http_restriction_title') }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text class="pa-4 a-text-regular-enlarged">
        <p class="mb-4">
          {{ t('nodes.popup.http_restriction_intro') }}
        </p>

        <h3 class="font-weight-bold mb-2">
          {{ t('nodes.popup.http_vs_https_title') }}
        </h3>
        <p class="mb-4">
          {{ t('nodes.popup.http_vs_https_http') }}<br />
          {{ t('nodes.popup.http_vs_https_https') }}
        </p>

        <h3 class="font-weight-bold mb-2">
          {{ t('nodes.popup.adamant_encryption_title') }}
        </h3>
        <p class="mb-4">
          {{ t('nodes.popup.adamant_encryption_text') }}
        </p>

        <h3 class="font-weight-bold mb-2">
          {{ t('nodes.popup.how_to_allow_title') }}
        </h3>
        <ul class="ml-4">
          <li>{{ t('nodes.popup.how_to_allow_browser') }}</li>
          <li>{{ t('nodes.popup.how_to_allow_http_app') }}</li>
        </ul>
      </v-card-text>

      <v-card-actions class="pa-3">
        <v-spacer />
        <v-btn variant="text" class="a-btn-regular" @click="show = false">
          {{ t('nodes.popup.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  props: {
    modelValue: {
      type: Boolean,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const show = computed({
      get: () => props.modelValue,
      set: (value: boolean) => emit('update:modelValue', value)
    })

    return {
      t,
      show
    }
  }
})
</script>
