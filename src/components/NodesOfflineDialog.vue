<template>
  <v-dialog v-model="showDialog" width="var(--a-secondary-dialog-width)" :class="className">
    <v-card>
      <v-card-title :class="`${className}__card-title`">
        {{ t('chats.nodes_offline_dialog.title', { coin: nodeType.toUpperCase() }) }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text :class="`${className}__card-text`">
        <div
          :class="`${className}__disclaimer`"
          v-html="t('chats.nodes_offline_dialog.text', { coin: nodeType.toUpperCase() })"
        ></div>
      </v-card-text>

      <v-col cols="12" :class="`${className}__btn-block`">
        <v-btn
          @click="openNodesScreen"
          :class="[`${className}__btn-free-tokens`, 'a-btn-primary']"
          variant="text"
          :prepend-icon="mdiOpenInNew"
        >
          <div :class="`${className}__btn-text`">
            {{ t('chats.nodes_offline_dialog.open_nodes_button') }}
          </div>
        </v-btn>
      </v-col>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { computed, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { NodeType } from '@/lib/nodes/types'
import { mdiOpenInNew } from '@mdi/js'

const className = 'all-nodes-disabled-dialog'
const classes = {
  root: className
}

export default {
  props: {
    nodeType: {
      type: String as PropType<NodeType>,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup() {
    const { t } = useI18n()
    const store = useStore()
    const router = useRouter()

    const showDialog = computed({
      get() {
        return store.state.chat.noActiveNodesDialog
      },
      set() {
        store.commit('chat/setNoActiveNodesDialog', { value: false })
      }
    })

    const openNodesScreen = () => {
      showDialog.value = false
      router.push({
        name: 'Nodes',
        state: {
          resetSettingsView: true
        }
      })
    }

    return {
      t,
      classes,
      showDialog,
      className,
      mdiOpenInNew,
      openNodesScreen
    }
  }
}
</script>
<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/components/_secondary-dialog.scss' as secondaryDialog;
@use 'vuetify/_settings.scss';

.all-nodes-disabled-dialog {
  @include secondaryDialog.a-secondary-dialog-warning-frame();

  &__card-title {
    @include secondaryDialog.a-secondary-dialog-title();
  }

  &__disclaimer {
    @include secondaryDialog.a-secondary-dialog-body-copy();
  }

  &__btn-block {
    @include secondaryDialog.a-secondary-dialog-action-block(
      var(--a-secondary-dialog-button-block-padding-top) 0
        var(--a-secondary-dialog-button-block-padding-bottom) 0
    );
  }
}

.v-theme--dark {
  .all-nodes-disabled-dialog {
    &__disclaimer {
      color: map.get(settings.$shades, 'white');
    }
  }
}
</style>
