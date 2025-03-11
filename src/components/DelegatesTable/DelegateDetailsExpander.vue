<template>
  <v-card flat :class="classes.root">
    <v-list :class="classes.list" density="compact">
      <v-list-item :class="classes.listItem">
        <v-list-item-title :class="classes.address">
          <a :href="getExplorerDelegateUrl(delegate.address)" target="_blank" rel="noopener">
            {{ delegate.address }}
          </a>
        </v-list-item-title>
      </v-list-item>

      <v-list-item v-for="(item, i) in delegateDetails" :key="i" :class="classes.listItem">
        <template #prepend>
          <v-list-item-title class="a-text-explanation">
            {{ item.title }}
          </v-list-item-title>
        </template>

        <template #append>
          <v-list-item-title class="a-text-explanation text-right">
            {{ item.value }}
          </v-list-item-title>
        </template>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script>
import { computed, defineComponent, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'

import { getExplorerDelegateUrl } from '@/config/utils'
import numberFormat from '@/filters/numberFormat'

export default defineComponent({
  props: {
    delegate: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const { delegate } = toRefs(props)
    const className = 'delegate-details-expander'
    const classes = {
      root: className,
      list: `${className}__list`,
      listItem: `${className}__list-item`,
      address: `${className}__address`
    }

    const { t } = useI18n()

    const delegateDetails = computed(() => [
      {
        title: t('votes.delegate_uptime'),
        value: `${delegate.value.productivity}%`
      },
      {
        title: t('votes.delegate_forged'),
        value: `${numberFormat(delegate.value.forged / 1e8, 1)} ADM`
      },
      {
        title: t('votes.delegate_link'),
        value: delegate.value.link
      },
      {
        title: t('votes.delegate_description'),
        value: delegate.value.description
      }
    ])

    return {
      classes,
      delegateDetails,
      getExplorerDelegateUrl
    }
  }
})
</script>

<style lang="scss">
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.delegate-details-expander {
  margin: 10px 26px;

  &__list-item {
    height: 36px;
    :deep(.v-list__tile) {
      padding-left: 20px;
      padding-right: 20px;
    }
  }
  &__address {
    a {
      @include mixins.a-text-active();
    }
  }
}

.v-theme--light {
  .delegate-details-expander {
    background-color: map.get(colors.$adm-colors, 'secondary2');

    &__address {
      a {
        color: map.get(colors.$adm-colors, 'regular');
      }
    }

    &__list {
      background-color: transparent;
    }
  }
}

.v-theme--dark {
  .delegate-details-expander {
    background-color: map.get(colors.$adm-colors, 'secondary2');

    &__address {
      a {
        color: map.get(colors.$adm-colors, 'primary');
      }
    }
  }
}
</style>
