<template>
  <v-layout row wrap justify-center>

    <app-toolbar
      :title="$t('options.page_title')"
      :show-back="false"
      flat
    />

    <v-flex xs12 sm12 md8 lg5>

      <!-- General -->
      <h3 class="title mb-3">{{ $t('options.general_title') }}</h3>
      <v-layout row wrap align-center class="mb-5">
        <v-flex xs6>
          <v-subheader class="pa-0">{{ $t('options.language_label') }}</v-subheader>
        </v-flex>
        <v-flex xs6 class="text-xs-right">
          <language-switcher/>
        </v-flex>
        <v-flex xs12>
          <v-checkbox
            :label="$t('options.dark_theme')"
            color="grey darken-1"
            v-model="darkTheme"
          />
        </v-flex>
      </v-layout>

      <!-- Security -->
      <h3 class="title mb-3">{{ $t('options.security_title') }}</h3>
      <v-layout row wrap align-center class="mb-5">
        <v-flex xs12>
          <v-checkbox
            :label="$t('options.exit_on_close')"
            :title="$t('options.exit_on_close_tooltip')"
            color="grey darken-1"
            v-model="logoutOnTabClose"
          />
        </v-flex>
      </v-layout>

      <!-- Chats -->
      <h3 class="title mb-3">{{ $t('options.chats_title') }}</h3>
      <v-layout row wrap align-center class="mb-5">
        <v-flex xs12>
          <v-checkbox
            :label="$t('options.send_on_enter')"
            :title="$t('options.send_on_enter_tooltip')"
            color="grey darken-1"
            v-model="sendMessageOnEnter"
          />
        </v-flex>
      </v-layout>

      <!-- Notifications -->
      <h3 class="title mb-3">{{ $t('options.notification_title') }}</h3>
      <v-layout row wrap align-center class="mb-5">
        <v-flex xs12>
          <v-checkbox
            :label="$t('options.enable_sound')"
            :title="$t('options.enable_sound_tooltip')"
            color="grey darken-1"
            v-model="allowSoundNotifications"
          />
        </v-flex>
        <v-flex xs12>
          <v-checkbox
            :label="$t('options.enable_bar')"
            :title="$t('options.enable_bar_tooltip')"
            color="grey darken-1"
            v-model="allowTabNotifications"
          />
        </v-flex>
        <v-flex xs12>
          <v-checkbox
            :label="$t('options.enable_push')"
            :title="$t('options.enable_push_tooltip')"
            color="grey darken-1"
            v-model="allowPushNotifications"
          />
        </v-flex>
      </v-layout>

      <!-- Other -->
      <h3 class="title mb-3">{{ $t('options.other') }}</h3>
      <v-layout row wrap align-center>
        <v-flex xs12 md6 class="px-1">
          <v-btn block @click="$router.push('/options/nodes')">{{ $t('options.nodes_list') }}</v-btn>
        </v-flex>
        <v-flex xs12 md6 class="px-1">
          <v-btn block @click="$router.push('/votes')">{{ $t('options.vote_for_delegates_button') }}</v-btn>
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
    },
    darkTheme: {
      get () {
        return this.$store.state.options.darkTheme
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'darkTheme',
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
