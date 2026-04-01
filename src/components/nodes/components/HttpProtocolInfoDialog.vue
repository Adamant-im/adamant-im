<template>
  <v-dialog v-model="show" width="var(--a-secondary-dialog-width)" :class="className">
    <v-card>
      <v-card-title :class="`${className}__dialog-title`">
        {{ t('nodes.popup.http_restriction_title') }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text :class="`${className}__dialog-body`">
        <p :class="`${className}__paragraph`">
          {{ t('nodes.popup.http_restriction_intro') }}
        </p>

        <h3 :class="`${className}__section-title`">
          {{ t('nodes.popup.http_vs_https_title') }}
        </h3>
        <p :class="`${className}__paragraph`">
          {{ t('nodes.popup.http_vs_https_http') }}<br />
          {{ t('nodes.popup.http_vs_https_https') }}
        </p>

        <h3 :class="`${className}__section-title`">
          {{ t('nodes.popup.adamant_encryption_title') }}
        </h3>
        <p :class="`${className}__paragraph`">
          {{ t('nodes.popup.adamant_encryption_text') }}
        </p>

        <h3 :class="`${className}__section-title`">
          {{ t('nodes.popup.how_to_allow_title') }}
        </h3>
        <ul :class="`${className}__list`">
          <li>{{ t('nodes.popup.how_to_allow_browser') }}</li>
          <li>{{ t('nodes.popup.how_to_allow_http_app') }}</li>
        </ul>
      </v-card-text>

      <v-card-actions :class="`${className}__dialog-actions`">
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
    const className = 'http-protocol-info-dialog'
    const show = computed({
      get: () => props.modelValue,
      set: (value: boolean) => emit('update:modelValue', value)
    })

    return {
      className,
      t,
      show
    }
  }
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/_secondary-dialog.scss' as secondaryDialog;
@use '@/assets/styles/components/_text-content.scss' as textContent;
@use '@/assets/styles/themes/adamant/_mixins.scss' as mixins;

.http-protocol-info-dialog {
  @include secondaryDialog.a-secondary-dialog-card-frame();

  &__dialog-title {
    @include mixins.a-text-header();
  }

  &__dialog-body {
    @include textContent.a-content-body-copy();
  }

  &__paragraph {
    margin-bottom: var(--a-space-4);
  }

  &__section-title {
    @include mixins.a-text-regular-enlarged-bold();
    margin-bottom: var(--a-space-2);
  }

  &__list {
    padding-inline-start: var(--a-space-4);
  }
}
</style>
