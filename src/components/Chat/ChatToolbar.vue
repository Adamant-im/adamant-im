<template>
  <v-toolbar
    flat
    height="56"
    :class="`${className}`"
    color="transparent"
  >
    <v-btn
      icon
      @click="goBack"
    >
      <v-icon icon="mdi-arrow-left" />
    </v-btn>
    <div v-if="!isChatReadOnly">
      <slot name="avatar-toolbar" />
    </div>
    <div :class="`${className}__textfield-container`">
      <div
        v-if="isChatReadOnly"
        :class="`${className}__adm-chat-name`"
        :style="{ paddingLeft: '12px' }"
      >
        {{ $t(partnerId) }}
      </div>
      <div v-else>
        <v-text-field
          v-model="partnerName"
          :class="`${className}__textfield`"
          variant="plain"
          background-color="transparent"
          :label="partnerId"
          hide-details
          density="compact"
        />
      </div>
    </div>

    <v-spacer />
  </v-toolbar>
</template>

<script>
import ChatAvatar from '@/components/Chat/ChatAvatar'
import partnerName from '@/mixins/partnerName'

export default {
  components: {
    ChatAvatar
  },
  mixins: [partnerName],
  props: {
    partnerId: {
      type: String,
      required: true
    }
  },
  emits: ['partner-info'],
  computed: {
    className: () => 'chat-toolbar',
    partnerName: {
      get () {
        return this.getPartnerName(this.partnerId)
      },
      set (value) {
        this.$store.commit('partners/displayName', {
          partner: this.partnerId,
          displayName: value
        })
      }
    },
    isChatReadOnly () {
      return this.$store.getters['chat/isChatReadOnly'](this.partnerId)
    }
  },
  methods: {
    goBack () {
      this.$router.push({ name: 'Chats' })
    },
    showPartnerInfo () {
      this.$emit('partner-info', true)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../assets/styles/themes/adamant/_mixins.scss';
@import 'vuetify/settings';
@import '../../assets/styles/settings/_colors.scss';

.chat-toolbar {
  flex-grow: 0;
  flex-shrink: 0;

  &__textfield-container {
    width: 100%;
  }

  &__adm-chat-name {
    font-size: 20px;
    font-weight: 500;
    letter-spacing: .02em;
  }

  &__textfield {
    // hides TextField border bottom
    :deep(.v-input__control) {
      & > .v-input__slot:before {
        border-width: 0;
        border-color: unset;
      }

      & > .v-input__slot:after {
        border-width: 0;
        background-color: unset;
        border-color: unset;
      }
    }
  }

  :deep(.v-toolbar__content > .v-btn:first-child) {
    margin-inline-start: 4px;
  }

  :deep(.v-text-field) {
    @include a-text-regular-enlarged-bold();

    .v-field__field {
      .v-label.v-field-label {
        max-width: unset;
        @include a-text-regular-enlarged-bold();
        font-size: 16px;
      }
    }

    .v-field__input {
      line-height: 20px;
      padding-top: 20px;
      font-weight: 500;
    }

    .v-field__outline {
      .v-label.v-field-label.v-field-label--floating {
        line-height: 20px;
        font-size: 20px;
        transform: translateY(-6px) scale(.6875);
        font-weight: 500;
      }
    }

    .v-input__control {
      padding: 0;
    }

    .v-input__control > .v-input__slot {
      margin-bottom: 0;
    }
  }

  :deep(.v-btn) {
    &:hover > .v-btn__overlay {
      opacity: 0;
    }
  }
}

/** Themes **/
.v-theme--light {
  .chat-toolbar {
    background-color: map-get($adm-colors, 'secondary2-transparent');

    :deep(.v-text-field) {
      .primary--text {
        color: map-get($grey, 'darken-1') !important;
      }
      .v-label {
        color: map-get($grey, 'darken-4');
      }
      .v-label--active {
        color: map-get($grey, 'darken-1');
      }
      input {
        caret-color: map-get($adm-colors, 'primary2');
      }
    }
  }
}
.v-theme--dark {
  .chat-toolbar {
    :deep(.v-text-field) {
      .primary--text {
        color: map-get($shades, 'white') !important;
      }
      .v-label {
        color: map-get($shades, 'white');
      }
      .v-label--active {
        color: map-get($shades, 'white');
      }
      input {
        caret-color: map-get($adm-colors, 'primary');
      }
    }
  }
}
</style>
