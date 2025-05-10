import Default from '@/layouts/default.vue'
import Toolbar from '@/layouts/toolbar.vue'
import Chat from '@/layouts/chat.vue'
import NoContainer from '@/layouts/no-container.vue'

import Container from '@/components/Container.vue'

export function registerGlobalComponents(app) {
  app.component('Default', Default)
  app.component('Toolbar', Toolbar)
  app.component('Chat', Chat)
  app.component('NoContainer', NoContainer)

  // components
  app.component('Container', Container)
}
