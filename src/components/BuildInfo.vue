<template>
  <div :class="[className, { [`${className}--testnet`]: info.isTestnet }]">
    <button
      type="button"
      :class="`${className}__trigger`"
      data-test-id="version-info"
      @click="onTriggerClick"
    >
      <span :class="`${className}__text`">
        <span :class="`${className}__line`">{{ lines.line1 }}</span>
        <span v-if="lines.line2" :class="`${className}__line`">{{ lines.line2 }}</span>
      </span>
      <span v-if="info.isTestnet" :class="`${className}__testnet-badge`">
        {{ t('build_info.testnet').toUpperCase() }}
      </span>
    </button>

    <BuildInfoDialog
      v-model="showDialog"
      :build-info="info"
      :allow-dev-mode-unlock="allowDevModeUnlock"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type PropType } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import BuildInfoDialog from '@/components/BuildInfoDialog.vue'
import {
  buildInfo as defaultBuildInfo,
  getBuildInfoLines,
  getCompactBuildInfoString,
  type BuildMetadata
} from '@/lib/buildInfo'

const props = defineProps({
  buildInfo: {
    type: Object as PropType<BuildMetadata>,
    default: () => defaultBuildInfo
  },
  allowDevModeUnlock: {
    type: Boolean,
    default: false
  }
})

const { t } = useI18n()
const store = useStore()
const className = 'build-info'
const showDialog = ref(false)
const tapCount = ref(0)

const info = computed<BuildMetadata>(() => props.buildInfo || defaultBuildInfo)
const lines = computed(() => getBuildInfoLines(info.value))
const compactText = computed(() => getCompactBuildInfoString(info.value))

const onTriggerClick = () => {
  if (props.allowDevModeUnlock) {
    tapCount.value++

    if (tapCount.value === 10 && store) {
      store.commit('options/updateOption', {
        key: 'devModeEnabled',
        value: true
      })

      store.dispatch('snackbar/show', {
        message: 'Dev screens enabled',
        timeout: 3000
      })
    }
  }

  showDialog.value = true
}

defineExpose({
  compactText
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss' as mixins;

.build-info {
  display: inline-flex;
  align-items: flex-end;
  justify-content: flex-end;

  &__trigger {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0;
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    font-family: var(--a-font-family-sans, sans-serif);
    color: inherit;
    text-align: right;
    transition:
      opacity var(--a-motion-base, 0.2s) linear,
      color var(--a-motion-base, 0.2s) linear;

    &:focus-visible {
      outline: none;
      box-shadow: var(--a-focus-ring);
      border-radius: var(--a-radius-xs, 4px);
    }
  }

  &__text {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
    color: inherit;
  }

  &__line {
    @include mixins.a-text-regular();
    line-height: 1.25;
    letter-spacing: normal;
    text-align: right;
    color: inherit;
  }

  &__testnet-badge {
    display: inline-block;
    font-size: 11px;
    font-weight: var(--a-font-weight-bold, 700);
    line-height: 1.2;
    margin-top: 4px;
    padding: 2px 6px;
    border-radius: var(--a-radius-xs, 4px);
    color: map.get(colors.$adm-colors, 'attention');
    border: 1px solid currentColor;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 1 !important;
  }
}

.v-theme--light {
  .build-info__trigger {
    color: map.get(colors.$adm-colors, 'black2');
    opacity: var(--a-opacity-icon-muted, 0.62);

    &:hover {
      opacity: 1;
    }
  }
}

.v-theme--dark {
  .build-info__trigger {
    color: var(--a-color-text-muted-dark);

    &:hover {
      color: map.get(colors.$adm-colors, 'secondary');
      opacity: 1;
    }
  }
}
</style>
