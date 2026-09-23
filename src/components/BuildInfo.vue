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
      <span v-if="info.isTestnet" :class="`${className}__testnet-badge`">TESTNET</span>
    </button>

    <BuildInfoDialog v-model="showDialog" :build-info="info" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type PropType } from 'vue'
import { useStore } from 'vuex'
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
  }
})

const store = useStore()
const className = 'build-info'
const showDialog = ref(false)
const tapCount = ref(0)

const info = computed<BuildMetadata>(() => props.buildInfo || defaultBuildInfo)
const lines = computed(() => getBuildInfoLines(info.value))
const compactText = computed(() => getCompactBuildInfoString(info.value))

const onTriggerClick = () => {
  tapCount.value++

  if (tapCount.value >= 10 && store) {
    store.commit('options/updateOption', {
      key: 'devMode',
      value: true
    })

    store.dispatch('snackbar/show', {
      message: 'Dev screens enabled',
      timeout: 3000
    })
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
    line-height: var(--a-line-height-tight, 1.25);
    letter-spacing: normal;
    text-align: right;
    color: inherit;
  }

  &__testnet-badge {
    display: inline-block;
    font-size: 8px;
    font-weight: var(--a-font-weight-bold, 700);
    line-height: 1;
    margin-top: 2px;
    padding: 1px 3px;
    border-radius: 2px;
    color: map.get(colors.$adm-colors, 'attention');
    border: 1px solid currentColor;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.v-theme--light {
  .build-info__trigger {
    color: map.get(colors.$adm-colors, 'black2');
    opacity: var(--a-login-icon-opacity, 0.4);

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
