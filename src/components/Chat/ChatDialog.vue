<template>
  <v-dialog v-model="show" width="var(--a-secondary-dialog-width)" :class="className">
    <v-card>
      <v-card-title :class="`${className}__card-title`">
        {{ title }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text :class="`${className}__card-text`">{{ text }}</v-card-text>

      <v-card-actions :class="`${className}__card-actions`">
        <v-spacer />

        <v-btn variant="text" class="a-btn-regular" @click="show = false">
          {{ $t('chats.ok') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    title: {
      type: String,
      default: ''
    },
    text: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  computed: {
    className: () => 'chat-dialog',
    show: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/_secondary-dialog.scss' as secondaryDialog;
@use '@/assets/styles/themes/adamant/_mixins.scss' as mixins;

.chat-dialog {
  @include secondaryDialog.a-secondary-dialog-card-frame();

  &__card-title {
    @include mixins.a-text-header();
  }
}
</style>
