import Default from '@/layouts/default'
import Toolbar from '@/layouts/toolbar'
import Chat from '@/layouts/chat'
import NoContainer from '@/layouts/no-container'
import Container from '@/components/Container'

export function registerGlobalComponents (app) {
  app.component('Default', Default)
  app.component('Toolbar', Toolbar)
  app.component('Chat', Chat)
  app.component('NoContainer', NoContainer)

  // components
  app.component('Container', Container)
}
