<template>
  <v-layout row wrap justify-center>
    <v-flex lg4 md5 sm12 xs12>

      <!-- General -->
      <h3 class="title grey--text text--darken-3 mb-3">{{ $t('general') }}</h3>
      <v-layout row wrap align-center class="mb-5">
        <v-flex xs6>
          <v-subheader class="pa-0">{{ $t('language') }}</v-subheader>
        </v-flex>
        <v-flex xs6 class="text-xs-right">
          <language-switcher/>
        </v-flex>
      </v-layout>

      <!-- Security -->
      <h3 class="title grey--text text--darken-3 mb-3">{{ $t('security') }}</h3>
      <v-layout row wrap align-center class="mb-5">
        <v-flex xs12>
          <v-checkbox
            :label="$t('logoutOnTabClose')"
            color="grey darken-1"
            v-model="logoutOnTabClose"
          ></v-checkbox>
        </v-flex>
      </v-layout>

      <!-- Chats -->
      <h3 class="title grey--text text--darken-3 mb-3">{{ $t('chats') }}</h3>
      <v-layout row wrap align-center class="mb-5">
        <v-flex xs12>
          <v-checkbox
            :label="$t('sendMessageOnEnter')"
            color="grey darken-1"
            v-model="sendMessageOnEnter"
          ></v-checkbox>
        </v-flex>
      </v-layout>

      <!-- Notifications -->
      <h3 class="title grey--text text--darken-3 mb-3">{{ $t('notifications') }}</h3>
      <v-layout row wrap align-center class="mb-5">
        <v-flex xs12>
          <v-checkbox
            :label="$t('sound')"
            color="grey darken-1"
            v-model="notifySound"
          ></v-checkbox>
        </v-flex>
        <v-flex xs12>
          <v-checkbox
            :label="$t('changeBrowserTabTitle')"
            color="grey darken-1"
            v-model="changeBrowserTabTitle"
          ></v-checkbox>
        </v-flex>
      </v-layout>

      <!-- Other -->
      <h3 class="title grey--text text--darken-3 mb-3">{{ $t('other') }}</h3>
      <v-layout row wrap align-center>
        <v-flex xs12>
          <v-btn @click="$router.push('/options/nodes')">{{ $t('nodeList') }}</v-btn>
          <v-btn @click="$router.push('/votes')">{{ $t('voteForDelegates') }}</v-btn>
        </v-flex>
      </v-layout>
    </v-flex>
  </v-layout>
</template>

<script>
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default {
  computed: {
    logoutOnTabClose: {
      get () {
        return !this.$store.state.storeInLocalStorage
      },
      set (value) {
        this.$store.commit('change_storage_method', !value)
      }
    },
    sendMessageOnEnter: {
      get () {
        return this.$store.state.sendOnEnter
      },
      set (value) {
        this.$store.commit('change_send_on_enter', value)
      }
    },
    notifySound: {
      get () {
        return this.$store.state.notifySound
      },
      set (value) {
        this.$store.commit('change_notify_sound', value)
      }
    },
    changeBrowserTabTitle: {
      get () {
        return this.$store.state.notifyBar
      },
      set (value) {
        this.$store.commit('change_notify_bar', value)
      }
    }
  },
  data: () => ({
  }),
  components: {
    LanguageSwitcher
  }
}
</script>

<i18n>
  {
    "en": {
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
      "changeBrowserTabTitle": "Change browser tab title"
    },
    "ru": {
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
      "changeBrowserTabTitle": "Менять заголовок вкладки браузера"
    }
  }
</i18n>
