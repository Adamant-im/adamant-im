import Vue from 'vue'

import Default from '@/layouts/default'
import Toolbar from '@/layouts/toolbar'
import Chat from '@/layouts/chat'
import NoContainer from '@/layouts/no-container'
import Container from '@/components/Container'

// Register layouts globally
Vue.component('Default', Default)
Vue.component('Toolbar', Toolbar)
Vue.component('Chat', Chat)
Vue.component('NoContainer', NoContainer)

// Register components
Vue.component('Container', Container)
