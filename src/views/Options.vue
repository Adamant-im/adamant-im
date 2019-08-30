<template>
  <div :class="className">
    <app-toolbar-centered
      app
      :title="$t('options.page_title')"
      :show-back="true"
      flat
    />

    <v-container fluid class="pa-0">
      <v-layout row wrap justify-center>

        <container padding>

          <!-- General -->
          <h3
            :class="`${className}__title a-text-caption`"
            class="mt-3 mb-3"
          >
            {{ $t('options.general_title') }}
          </h3>
          <v-layout row wrap align-center>
            <v-flex xs6>
              <v-subheader
                :class="`${className}__label`"
                class="pa-0"
              >
                {{ $t('options.language_label') }}
              </v-subheader>
            </v-flex>
            <v-flex xs6 class="text-xs-right">
              <language-switcher
                append-icon="mdi-chevron-down"
              />
            </v-flex>
            <v-flex xs12 class="mt-2">
              <v-checkbox
                :label="$t('options.dark_theme')"
                color="grey darken-1"
                v-model="darkTheme"
              />
            </v-flex>
          </v-layout>

          <!-- Security -->
          <h3
            :class="`${className}__title a-text-caption`"
            class="mt-4 mb-4"
          >
            {{ $t('options.security_title') }}
          </h3>
          <v-layout row wrap align-center>
            <v-flex xs12 a-text-regular-enlarged>
              <v-checkbox
                :label="$t('options.exit_on_close')"
                color="grey darken-1"
                :input-value="logoutOnTabClose"
                @click="onCheckLogoutOnTabClose"
                readonly
              />

              <div class="a-text-explanation-enlarged">{{ $t('options.exit_on_close_tooltip') }}</div>

              <password-set-dialog v-model="passwordDialog" @password="onSetPassword" />
            </v-flex>
          </v-layout>

          <!-- Chats -->
          <h3
            :class="`${className}__title a-text-caption`"
            class="mt-4 mb-4"
          >
            {{ $t('options.chats_title') }}
          </h3>
          <v-layout row wrap align-center>
            <v-flex xs12>
              <v-checkbox
                :label="$t('options.send_on_enter')"
                color="grey darken-1"
                v-model="sendMessageOnEnter"
              />

              <div class="a-text-explanation-enlarged">{{ $t('options.send_on_enter_tooltip') }}</div>
            </v-flex>

            <v-flex xs12 class="mt-4">
              <v-checkbox
                :label="$t('options.format_messages')"
                color="grey darken-1"
                v-model="formatMessages"
              />

              <div class="a-text-explanation-enlarged">{{ $t('options.format_messages_tooltip') }}</div>
            </v-flex>
          </v-layout>

          <!-- Notifications -->
          <h3
            :class="`${className}__title a-text-caption`"
            class="mt-4 mb-4"
          >
            {{ $t('options.notification_title') }}
          </h3>
          <v-layout row wrap align-center>
            <v-flex xs12>
              <v-checkbox
                :label="$t('options.enable_sound')"
                color="grey darken-1"
                v-model="allowSoundNotifications"
              />

              <div class="a-text-explanation-enlarged">{{ $t('options.enable_sound_tooltip') }}</div>
            </v-flex>
            <v-flex xs12 class="mt-4">
              <v-checkbox
                :label="$t('options.enable_bar')"
                color="grey darken-1"
                v-model="allowTabNotifications"
              />

              <div class="a-text-explanation-enlarged">{{ $t('options.enable_bar_tooltip') }}</div>
            </v-flex>
            <v-flex xs12 class="mt-4">
              <v-checkbox
                :label="$t('options.enable_push')"
                color="grey darken-1"
                v-model="allowPushNotifications"
              />

              <div class="a-text-explanation-enlarged">{{ $t('options.enable_push_tooltip') }}</div>
            </v-flex>
          </v-layout>

          <!-- Actions -->
          <h3
            :class="`${className}__title a-text-caption`"
            class="mt-4 mb-4"
          >
            {{ $t('options.actions') }}
          </h3>
          <v-layout row wrap>
            <v-flex xs12>
            <v-list>
              <v-list-tile @click="$router.push('/options/nodes')">
                <v-list-tile-content>
                  <v-list-tile-title  :class="`${className}__list__title`" >
                    {{ $t('options.nodes_list') }}
                  </v-list-tile-title>
                </v-list-tile-content>
                <div>
                  <v-list-tile-title :class="`${className}__list__value`">
                    <v-icon size="20">mdi-chevron-right</v-icon>
                  </v-list-tile-title>
                </div>
              </v-list-tile>

              <v-list-tile  @click="$router.push('/votes')">
                <v-list-tile-content>
                  <v-list-tile-title :class="`${className}__list__title`" >
                    {{ $t('options.vote_for_delegates_button') }}
                  </v-list-tile-title>
                </v-list-tile-content>
                <div>
                  <v-list-tile-title :class="`${className}__value`">
                    <v-icon size="20">mdi-chevron-right</v-icon>
                  </v-list-tile-title>
                </div>
              </v-list-tile>

              <v-divider/>

              <v-list-tile  @click="logout">
                <v-list-tile-content>
                  <v-list-tile-title :class="`${className}__list__title`" >
                    {{ $t('bottom.exit_button') }}
                  </v-list-tile-title>
                </v-list-tile-content>
                <div>
                  <v-list-tile-title :class="`${className}__value`">
                    <v-icon size="20">mdi-logout-variant</v-icon>
                  </v-list-tile-title>
                </div>
              </v-list-tile>

            </v-list>
            </v-flex>
          </v-layout>
          <v-layout>
            <div
              :class="`${className}__version_info ml-auto`"
            >
              {{ $t('options.version') }} {{ this.$root.$options.version }}
            </div>
          </v-layout>

        </container>

      </v-layout>
    </v-container>
  </div>
</template>

<script>
import LanguageSwitcher from '@/components/LanguageSwitcher'
import AppToolbarCentered from '@/components/AppToolbarCentered'
import PasswordSetDialog from '@/components/PasswordSetDialog'
import { clearDb, db as isIDBSupported } from '@/lib/idb'
import scrollPosition from '@/mixins/scrollPosition'

export default {
  computed: {
    className: () => 'settings-view',
    logoutOnTabClose () {
      return this.$store.state.options.logoutOnTabClose
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
    formatMessages: {
      get () {
        return this.$store.state.options.formatMessages
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'formatMessages',
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
    },
    isLoginViaPassword () {
      return this.$store.getters['options/isLoginViaPassword']
    }
  },
  data: () => ({
    passwordDialog: false
  }),
  methods: {
    onSetPassword () {
      this.$store.commit('options/updateOption', {
        key: 'logoutOnTabClose',
        value: false
      })
    },
    onCheckLogoutOnTabClose () {
      if (this.logoutOnTabClose) {
        isIDBSupported
          .then(() => {
            this.passwordDialog = true
          })
          .catch(() => {
            this.$store.dispatch('snackbar/show', {
              message: this.$t('options.idb_not_supported'),
              timeout: 5000
            })
          })
      } else {
        clearDb().then(() => {
          this.$store.commit('options/updateOption', {
            key: 'logoutOnTabClose',
            value: true
          })

          this.$store.commit('resetPassword')
        })
      }
    },
    logout () {
      this.$store.dispatch('stopInterval')
      this.$store.dispatch('logout')

      if (this.isLoginViaPassword) {
        return clearDb()
          .catch(err => {
            console.error(err)
          })
          .finally(() => {
            // turn off `loginViaPassword` option
            this.$store.commit('options/updateOption', { key: 'logoutOnTabClose', value: true })

            this.$router.push('/')
          })
      } else {
        return Promise.resolve(this.$router.push('/'))
      }
    }
  },
  mixins: [scrollPosition],
  components: {
    LanguageSwitcher,
    AppToolbarCentered,
    PasswordSetDialog
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_variables.styl'
@import '~vuetify/src/stylus/settings/_colors.styl'
@import '../assets/stylus/settings/_colors.styl'
@import '../assets/stylus/themes/adamant/_mixins.styl'

.settings-view
  &__title
    padding-top: 15px
    padding-bottom: 5px
    margin-left: -24px
    margin-right: -24px
    padding-left: 24px
    padding-right: 24px
  &__version_info
    a-text-explanation()
    margin-top: 24px
  &__action
    display: block
    font-size: 16px
    font-weight: 500
    text-decoration-line: underline
    margin: 6px 8px
    padding: 0 16px
  >>> .v-input--selection-controls:not(.v-input--hide-details) .v-input__slot
    margin-bottom: 0
  >>> .v-input--selection-controls
    margin-top: 0
  >>> .v-label, &__label, &__list__title
    a-text-regular-enlarged()
  >>> .v-list
    background: transparent
    padding: 0
  >>> .v-list__tile
    padding: 0 24px
    margin: 0 -24px

/** Themes **/
.theme--light
  .settings-view
    &__version_info
      color: $adm-colors.muted
    &__title
      background-color: $adm-colors.secondary2-transparent
      color: $adm-colors.regular
    &__action
      color: $adm-colors.regular
    >>> .v-label, &__label
      color: $adm-colors.regular
    .v-divider
      border-color: $adm-colors.secondary2
.theme--dark
  .settings-view
    &__action
      color: $shades.white

/** Breakpoints **/
@media $display-breakpoints.sm-and-down
  .settings-view
    &__title
      margin-left: -16px
      margin-right: -16px
      padding-left: 16px
      padding-right: 16px

    >>> .v-list__tile
      padding: 0 16px
      margin: 0 -16px
</style>
