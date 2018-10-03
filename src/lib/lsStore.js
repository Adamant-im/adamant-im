import merge from 'deepmerge'
import {
  encryptData,
  getAdmDataBase,
  updateChatItem,
  updateCommonItem, updateContactItem
} from './indexedDb'

export default function storeData () {
  return store => {
    var localStorageAvailable = function () {
      var supported = true
      try {
        var ls = window.localStorage
        var test = '__hz-ls-test__'
        ls.setItem(test, test)
        ls.removeItem(test)
      } catch (e) {
        supported = false
      }
      return supported
    }
    var lsStorage = false
    if (localStorageAvailable()) {
      lsStorage = window.localStorage
    }
    let mainStorage = window.sessionStorage
    if (mainStorage.getItem('language')) {
      store.commit('change_lang', mainStorage.getItem('language'))
    }
    if (mainStorage.getItem('notify_sound')) {
      store.commit('change_notify_sound', mainStorage.getItem('notify_sound'))
    }
    if (mainStorage.getItem('send_on_enter')) {
      store.commit('change_send_on_enter', mainStorage.getItem('send_on_enter'))
    }
    if (mainStorage.getItem('notify_bar')) {
      store.commit('change_notify_bar', mainStorage.getItem('notify_bar'))
    }
    if (mainStorage.getItem('notify_desktop')) {
      store.commit('change_notify_desktop', mainStorage.getItem('notify_desktop'))
    }
    var storeInLocalStorage = mainStorage.getItem('storeInLocalStorage')
    if (storeInLocalStorage === 'false') {
      storeInLocalStorage = false
    }
    if (storeInLocalStorage) {
      store.commit('change_storage_method', storeInLocalStorage)
    }
    let useStorage = window.sessionStorage
    if (storeInLocalStorage && lsStorage) {
      useStorage = lsStorage
    }
    var value = useStorage.getItem('adm-persist')
    if (value !== 'undefined') {
      if (value) {
        value = JSON.parse(value)
      }
    }
    if (typeof value === 'object' && value !== null) {
      store.replaceState(merge(store.state, value, {
        arrayMerge: function (store, saved) { return saved },
        clone: false
      }))

      store.dispatch('rehydrate')
    }
    window.onbeforeunload = function () {
      this.$store.commit('force_update')
    }
    let lastChatUpdateTime = 0
    store.subscribe((mutation, state) => {
      if (sessionStorage.getItem('storeInLocalStorage') === 'true' && sessionStorage.getItem('userPassword')) {
        getAdmDataBase().then((db) => {
          let copyState = Object.assign({}, state)
          if (mutation.type === 'partners/contactList') {
            // Save contacts
            const contacts = copyState.partners
            encryptData(JSON.stringify(contacts)).then((encryptedContacts) => {
              updateContactItem(db, encryptedContacts)
            })
          }
          if (mutation.type === 'add_chat_message') {
            // Save chats
            if (lastChatUpdateTime > 0 && new Date().getTime() - lastChatUpdateTime > 1000) {
              lastChatUpdateTime = new Date().getTime()
              const chats = copyState.chats
              for (let chat in chats) {
                if (chats.hasOwnProperty(chat) && chat === 'recipientId') {
                  encryptData(JSON.stringify(chats[chat])).then((encryptedChat) => {
                    updateChatItem(db, chat, encryptedChat)
                  })
                }
              }
            } else {
              lastChatUpdateTime = new Date().getTime()
            }
          }
          let storeNow = false
          if (mutation.type === 'change_lang') {
            storeNow = true
          } else if (mutation.type === 'change_notify_sound') {
            storeNow = true
          } else if (mutation.type === 'change_notify_bar') {
            storeNow = true
          } else if (mutation.type === 'change_notify_desktop') {
            storeNow = true
          } else if (mutation.type === 'change_send_on_enter') {
            storeNow = true
          } else if (mutation.type === 'logout') {
            storeNow = true
          } else if (mutation.type === 'save_passphrase') {
            storeNow = true
          } else if (mutation.type === 'force_update') {
            storeNow = true
          } else if (mutation.type === 'change_partner_name') {
            storeNow = true
          } else if (mutation.type === 'leave_chat') {
            storeNow = true
          } else if (mutation.type === 'ajax_start' || mutation.type === 'ajax_end' || mutation.type === 'ajax_end_with_error' || mutation.type === 'start_tracking_new' || mutation.type === 'have_loaded_chats' || mutation.type === 'connect' || mutation.type === 'login') {
            return
          }
          if (storeNow) {
            // Exclude contact list, chats, passphrase from common store
            delete copyState.partners
            delete copyState.chats
            delete copyState.passPhrase
            encryptData(JSON.stringify(copyState)).then((encryptedCommonData) => {
              updateCommonItem(db, encryptedCommonData)
            })
          }
        })
      } else {
        let storeNow = false
        if (mutation.type === 'change_storage_method') {
          if (!mutation.payload) {
            useStorage = sessionStorage.setItem('adm-persist', JSON.stringify(state))
          }
          try {
            mainStorage.setItem('storeInLocalStorage', mutation.payload)
          } catch (e) {
          }
          storeNow = true
        } else if (mutation.type === 'change_lang') {
          mainStorage.setItem('language', mutation.payload)
          storeNow = true
        } else if (mutation.type === 'change_notify_sound') {
          mainStorage.setItem('notify_sound', mutation.payload)
          storeNow = true
        } else if (mutation.type === 'change_notify_bar') {
          mainStorage.setItem('notify_bar', mutation.payload)
          storeNow = true
        } else if (mutation.type === 'change_notify_desktop') {
          mainStorage.setItem('notify_desktop', mutation.payload)
          storeNow = true
        } else if (mutation.type === 'change_send_on_enter') {
          mainStorage.setItem('send_on_enter', mutation.payload)
          storeNow = true
        }
        if (mutation.type === 'logout') {
          storeNow = true
        }
        if (mutation.type === 'save_passphrase') {
          storeNow = true
        }
        if (mutation.type === 'force_update') {
          storeNow = true
        }
        if (mutation.type === 'change_partner_name') {
          storeNow = true
        }
        if (mutation.type === 'leave_chat') {
          storeNow = true
        }
        if (mutation.type === 'ajax_start' || mutation.type === 'ajax_end' || mutation.type === 'ajax_end_with_error' || mutation.type === 'start_tracking_new' || mutation.type === 'have_loaded_chats' || mutation.type === 'connect' || mutation.type === 'login') {
          return
        }
        if (storeNow) {
          try {
            useStorage.setItem('adm-persist', JSON.stringify(state))
          } catch (e) {
          }
        } else {
          if (window.storeTimer) {
            window.clearTimeout(window.storeTimer)
          }
          var storeTimer = window.setTimeout(function () {
            window.ep.$store.commit('force_update')
            window.storeTimer = undefined
          }, 10000)
          window.storeTimer = storeTimer
        }
      }
    })
  }
}
