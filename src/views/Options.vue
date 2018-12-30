<template>
  <v-layout row wrap justify-center>

    <app-toolbar
      :title="$t('pageTitle')"
      :show-back="false"
      flat
    />

    <v-flex xs12 sm12 md8 lg5>

      <!-- General -->
      <h3 class="title mb-3">{{ $t('general') }}</h3>
      <v-layout row wrap align-center class="mb-5">
        <v-flex xs6>
          <v-subheader class="pa-0">{{ $t('language') }}</v-subheader>
        </v-flex>
        <v-flex xs6 class="text-xs-right">
          <language-switcher/>
        </v-flex>
      </v-layout>

      <!-- Security -->
      <h3 class="title mb-3">{{ $t('security') }}</h3>
      <v-layout row wrap align-center class="mb-5">
        <v-flex xs12>
          <v-checkbox
            :label="$t('logoutOnTabClose')"
            color="grey darken-1"
            v-model="logoutOnTabClose"
          />
        </v-flex>
      </v-layout>

      <!-- Chats -->
      <h3 class="title mb-3">{{ $t('chats') }}</h3>
      <v-layout row wrap align-center class="mb-5">
        <v-flex xs12>
          <v-checkbox
            :label="$t('sendMessageOnEnter')"
            color="grey darken-1"
            v-model="sendMessageOnEnter"
          />
        </v-flex>
      </v-layout>

      <!-- Notifications -->
      <h3 class="title mb-3">{{ $t('notifications') }}</h3>
      <v-layout row wrap align-center class="mb-5">
        <v-flex xs12>
          <v-checkbox
            :label="$t('sound')"
            color="grey darken-1"
            v-model="allowSoundNotifications"
          />
        </v-flex>
        <v-flex xs12>
          <v-checkbox
            :label="$t('changeBrowserTabTitle')"
            color="grey darken-1"
            v-model="allowTabNotifications"
          />
        </v-flex>
        <v-flex xs12>
          <v-checkbox
            :label="$t('push')"
            color="grey darken-1"
            v-model="allowPushNotifications"
          />
        </v-flex>
      </v-layout>

      <!-- Other -->
      <h3 class="title mb-3">{{ $t('other') }}</h3>
      <v-layout row wrap align-center>
        <v-flex xs12 md6 class="px-1">
          <v-btn block @click="$router.push('/options/nodes')">{{ $t('nodeList') }}</v-btn>
        </v-flex>
        <v-flex xs12 md6 class="px-1">
          <v-btn block @click="$router.push('/votes')">{{ $t('voteForDelegates') }}</v-btn>
        </v-flex>
      </v-layout>

    </v-flex>

  </v-layout>
</template>

<script>
import LanguageSwitcher from '@/components/LanguageSwitcher'
import AppToolbar from '@/components/AppToolbar'

export default {
  computed: {
    logoutOnTabClose: {
      get () {
        return this.$store.state.options.logoutOnTabClose
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'logoutOnTabClose',
          value
        })
      }
    },
    sendMessageOnEnter: {
      get () {
        return this.$store.state.options.sendMessageOnEnter
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'sendMessageOnEnter',
          value
        })
      }
    },
    allowSoundNotifications: {
      get () {
        return this.$store.state.options.allowSoundNotifications
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'allowSoundNotifications',
          value
        })
      }
    },
    allowTabNotifications: {
      get () {
        return this.$store.state.options.allowTabNotifications
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'allowTabNotifications',
          value
        })
      }
    },
    allowPushNotifications: {
      get () {
        return this.$store.state.options.allowPushNotifications
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'allowPushNotifications',
          value
        })
      }
    }
  },
  data: () => ({
  }),
  components: {
    LanguageSwitcher,
    AppToolbar
  }
}
</script>

<i18n>
  {
    "en": {
      "pageTitle": "Settings",
      "general": "General",
      "chats": "Chats",
      "language": "Language",
      "security": "Security",
      "notifications": "Notifications",
      "other": "Other",
      "nodeList": "Node list",
      "voteForDelegates": "Vote for delegates",
      "logoutOnTabClose": "Logout on tab close",
      "sendMessageOnEnter": "Send message on Enter",
      "sound": "Sound",
      "push": "Allow PUSH-notifications",
      "changeBrowserTabTitle": "Change browser tab title"
    },
    "ru": {
      "pageTitle": "Настройки",
      "general": "Общие",
      "chats": "Чаты",
      "language": "Язык",
      "security": "Безопасность",
      "notifications": "Уведомления",
      "other": "Другое",
      "nodeList": "Список узлов",
      "voteForDelegates": "Голосовать за делегатов",
      "logoutOnTabClose": "Выходить из кошелька при закрытии вкладки браузера",
      "sendMessageOnEnter": "Отправлять сообщения при нажатии Enter",
      "sound": "Звуковые уведомления",
      "push": "Разрешить PUSH-уведомления",
      "changeBrowserTabTitle": "Менять заголовок вкладки браузера"
    }
  }
</i18n>
