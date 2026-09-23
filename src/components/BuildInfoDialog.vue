<template>
  <v-dialog v-model="show" eager width="var(--a-secondary-dialog-width)" :class="className">
    <v-card>
      <v-card-title :class="`${className}__card-title`">
        {{ t('build_info.dialog_title') }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text :class="`${className}__body`">
        <div :class="`${className}__about`">
          {{ t('build_info.about_text') }}
          <a :class="`${className}__link`" href="#" @click.prevent="openRepoLink">
            {{ GITHUB_REPO_URL }}</a
          >.
        </div>

        <div :class="`${className}__section-title`">
          {{ t('build_info.info_title') }}
        </div>

        <div :class="`${className}__meta`">
          <div :class="`${className}__meta-row`">
            {{ t('build_info.version') }}:
            <span :class="`${className}__value`">v{{ info.version }}</span>
          </div>
          <div v-if="info.isTestnet" :class="`${className}__meta-row`">
            {{ t('build_info.network') }}:
            <span :class="`${className}__testnet-badge`">{{ t('build_info.testnet') }}</span>
          </div>
          <div :class="`${className}__meta-row`">
            {{ t('build_info.branch') }}:
            <a
              v-if="info.branch"
              :class="[`${className}__link`, `${className}__value`]"
              href="#"
              @click.prevent="openBranchLink"
            >
              {{ info.branch }}
            </a>
            <span v-else :class="`${className}__value`">—</span>
          </div>
          <div v-if="info.prNumber" :class="`${className}__meta-row`">
            {{ t('build_info.pull_request') }}:
            <a
              :class="[`${className}__link`, `${className}__value`]"
              href="#"
              @click.prevent="openPrLink"
            >
              #{{ info.prNumber }}
            </a>
          </div>
          <div :class="`${className}__meta-row`">
            {{ t('build_info.commit') }}:
            <a
              v-if="info.commit"
              :class="[`${className}__link`, `${className}__value`]"
              href="#"
              @click.prevent="openCommitLink"
            >
              {{ info.commit }}
            </a>
            <span v-else :class="`${className}__value`">—</span>
          </div>
          <div :class="`${className}__meta-row`">
            {{ t('build_info.author') }}:
            <a
              v-if="info.author"
              :class="[`${className}__link`, `${className}__value`]"
              href="#"
              @click.prevent="openAuthorLink"
            >
              {{ info.author }}
            </a>
            <span v-else :class="`${className}__value`">—</span>
          </div>
          <div :class="`${className}__meta-row`">
            {{ t('build_info.build_date') }}:
            <span :class="`${className}__value`">{{ info.buildDate }}</span>
          </div>
        </div>
      </v-card-text>

      <v-card-actions :class="`${className}__actions`">
        <v-spacer />

        <v-btn variant="text" class="a-btn-regular" @click="show = false">
          {{ t('build_info.close') }}
        </v-btn>

        <v-btn variant="text" class="a-btn-regular" :disabled="isUpdating" @click="handleUpdate">
          <v-progress-circular
            v-show="isUpdating"
            indeterminate
            color="primary"
            :size="AUTH_FORM_SUBMIT_SPINNER_SIZE"
            :class="`${className}__submit-spinner`"
          />
          {{ isUpdating ? t('build_info.updating') : t('build_info.update_button') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { openExternalLink } from '@/lib/openExternalLink'
import { AUTH_FORM_SUBMIT_SPINNER_SIZE } from '@/components/Login/helpers/uiMetrics'
import {
  buildInfo as defaultBuildInfo,
  GITHUB_REPO_URL,
  getBranchUrl,
  getCommitUrl,
  getAuthorUrl,
  getPrUrl,
  forceAppUpdate,
  type BuildMetadata
} from '@/lib/buildInfo'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  buildInfo: {
    type: Object as PropType<BuildMetadata>,
    default: () => defaultBuildInfo
  }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const className = 'build-info-dialog'
const isUpdating = ref(false)

const show = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const info = computed<BuildMetadata>(() => props.buildInfo || defaultBuildInfo)

const openRepoLink = () => {
  openExternalLink(GITHUB_REPO_URL)
}

const openBranchLink = () => {
  openExternalLink(getBranchUrl(info.value.branch))
}

const openCommitLink = () => {
  openExternalLink(getCommitUrl(info.value.commit))
}

const openAuthorLink = () => {
  openExternalLink(getAuthorUrl(info.value.author))
}

const openPrLink = () => {
  if (info.value.prNumber) {
    openExternalLink(getPrUrl(info.value.prNumber))
  }
}

const handleUpdate = async () => {
  isUpdating.value = true
  await forceAppUpdate()
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/components/_secondary-dialog.scss' as secondaryDialog;
@use 'vuetify/settings';

.build-info-dialog {
  @include secondaryDialog.a-secondary-dialog-card-frame();

  &__card-title {
    @include secondaryDialog.a-secondary-dialog-title();
  }

  &__body {
    @include secondaryDialog.a-secondary-dialog-body-copy();
  }

  &__about {
    word-break: break-word;
  }

  &__section-title {
    word-break: break-word;
    margin-top: var(--a-space-4);
    margin-bottom: var(--a-space-3);
  }

  &__meta {
    display: flex;
    flex-direction: column;
  }

  &__meta-row {
    padding-block: 2px;
    word-break: break-word;
  }

  &__value {
    font-family: inherit;
    font-weight: inherit;
  }

  &__link {
    @include secondaryDialog.a-secondary-dialog-link-action();
    font-size: inherit;
    font-weight: inherit;
    cursor: pointer;

    &:hover {
      opacity: var(--a-opacity-interactive-hover, 0.8);
    }
  }

  &__testnet-badge {
    color: map.get(colors.$adm-colors, 'attention');
    font-weight: inherit;
    text-transform: uppercase;
  }

  &__submit-spinner {
    margin-inline-end: var(--a-auth-control-inline-gap);
  }
}

.v-theme--light {
  .build-info-dialog {
    &__card-title {
      color: map.get(colors.$adm-colors, 'regular');
    }
  }
}

.v-theme--dark {
  .build-info-dialog {
    &__card-title {
      color: map.get(settings.$shades, 'white');
    }
  }
}
</style>
