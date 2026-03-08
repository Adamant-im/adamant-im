<template>
  <div class="text-right">
    <v-btn class="a-btn-primary ma-2" color="primary" @click="isDialogVisible = true">
      {{ t('wallets.reset') }}
    </v-btn>

    <v-dialog
      v-model="isDialogVisible"
      width="var(--a-secondary-dialog-width)"
      scroll-strategy="reposition"
      :class="classes.root"
    >
      <v-card>
        <v-card-title :class="`${classes.root}__dialog-title`">
          {{ t('wallets.summary_title') }}
        </v-card-title>

        <v-divider :class="`${classes.root}__divider`" />

        <v-card-text :class="`${classes.root}__dialog-body`">
          <div :class="`${classes.root}__dialog-summary`">
            {{ t('wallets.reset_message') }}
          </div>
        </v-card-text>

        <v-card-actions :class="`${classes.root}__dialog-actions`">
          <v-spacer></v-spacer>
          <v-btn variant="text" class="a-btn-regular" @click="isDialogVisible = false">
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn variant="text" class="a-btn-regular" @click="reset">{{
            t('common.confirm')
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

const className = 'wallet-reset-dialog'
const classes = {
  root: className
}

export default defineComponent({
  setup() {
    const { t } = useI18n()
    const store = useStore()

    const isDialogVisible = ref(false)

    const reset = () => {
      store.dispatch('wallets/initWalletsSymbols')
      isDialogVisible.value = false
    }

    return {
      classes,
      isDialogVisible,
      reset,
      t
    }
  }
})
</script>

<style scoped lang="scss">
@use 'sass:map';
@use '@/assets/styles/components/_secondary-dialog.scss' as secondaryDialog;
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.wallet-reset-dialog {
  @include secondaryDialog.a-secondary-dialog-card-frame();
  &__dialog-summary {
    @include mixins.a-text-regular-enlarged();
  }
  &__dialog-title {
    @include mixins.a-text-header();
  }
}

/** Themes **/
.v-theme--light {
  .wallet-reset-dialog {
    &__dialog-summary {
      color: map.get(colors.$adm-colors, 'regular');
    }
    &__dialog-title {
      color: map.get(colors.$adm-colors, 'regular');
    }
    &__divider {
      border-color: map.get(colors.$adm-colors, 'regular');
    }
  }
}
</style>
