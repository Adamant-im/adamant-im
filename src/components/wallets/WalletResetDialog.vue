<template>
  <div class="text-center">
    <v-btn color="primary" @click="isDialogVisible = true"> {{ t('wallets.reset') }} </v-btn>

    <v-dialog v-model="isDialogVisible" width="500" scroll-strategy="reposition">
      <v-card>
        <v-card-text>
          {{ t('wallets.reset_message') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="isDialogVisible = false">{{ t('common.no') }}</v-btn>
          <v-btn color="primary" @click="reset">{{ t('common.yes') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  setup() {
    const { t } = useI18n()
    const store = useStore()

    const isDialogVisible = ref(false)

    const reset = () => {
      store.dispatch('initWalletsTemplates', null, { root: true })
      isDialogVisible.value = false
    }

    return {
      isDialogVisible,
      reset,
      t
    }
  }
})
</script>

<style scoped lang="scss"></style>
