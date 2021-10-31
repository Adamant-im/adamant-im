import Vue from 'vue'
import Router from 'vue-router'
import navigationGuard from '@/router/navigationGuard'

import IsLogged from '@/middlewares/isLogged'
import AuthMiddleware from '@/middlewares/auth'
import DocumentTitle from '@/middlewares/title'
import Chats from '@/views/Chats'
import Chat from '@/views/Chat'
import SendFunds from '@/views/SendFunds'
import Transaction from '@/views/transactions/Transaction'
import Transactions from '@/views/Transactions'
import Options from '@/views/Options'
import Home from '@/views/Home'
import Votes from '@/views/Votes'
import Nodes from '@/views/Nodes'
import Login from '@/views/Login'
import ExportKeys from '@/views/ExportKeys'

Vue.use(Router)

const router = new Router({
  mode: process.env.VUE_APP_ELECTRON_MODE === 'production' ? 'hash' : 'history',
  routes: [
    {
      path: '/options/nodes',
      name: 'Nodes',
      component: Nodes,
      meta: {
        requiresAuth: true,
        layout: 'no-container'
      }
    },
    {
      path: '/options/export-keys',
      name: 'ExportKeys',
      component: ExportKeys,
      meta: {
        requiresAuth: true,
        layout: 'no-container'
      }
    },
    {
      path: '/votes',
      name: 'Votes',
      component: Votes,
      meta: {
        requiresAuth: true,
        layout: 'no-container'
      }
    },
    {
      path: '/transactions/:crypto/:txId',
      component: Transaction,
      name: 'Transaction',
      props: true,
      meta: {
        requiresAuth: true,
        layout: 'no-container',
        containerNoPadding: true,
        previousRoute: {}
      },
      beforeEnter: navigationGuard.transactions
    },
    {
      path: '/transactions/:crypto?',
      component: Transactions,
      name: 'Transactions',
      props: true,
      meta: {
        requiresAuth: true,
        layout: 'no-container',
        containerNoPadding: true,
        previousRoute: {},
        previousPreviousRoute: {}
      },
      beforeEnter: navigationGuard.transactions
    },
    {
      path: '/options',
      name: 'Options',
      component: Options,
      meta: {
        requiresAuth: true,
        layout: 'no-container',
        showNavigation: true,
        scrollPosition: {
          x: 0,
          y: 0
        }
      }
    },
    {
      path: '/chats/:partnerId/',
      component: Chat,
      name: 'Chat',
      props: true,
      meta: {
        requiresAuth: true,
        layout: 'chat'
      },
      beforeEnter: navigationGuard.chats
    },
    {
      path: '/chats',
      props: true,
      name: 'Chats',
      component: Chats,
      meta: {
        requiresAuth: true,
        layout: 'toolbar',
        containerNoPadding: true,
        showNavigation: true,
        scrollPosition: {
          x: 0,
          y: 0
        }
      }
    },
    {
      path: '/transfer/:cryptoCurrency?/:recipientAddress?/:amountToSend?',
      name: 'SendFunds',
      component: SendFunds,
      props: true,
      meta: {
        requiresAuth: true,
        layout: 'no-container'
      }
    },
    {
      path: '/home',
      name: 'Home',
      component: Home,
      meta: {
        requiresAuth: true,
        layout: 'toolbar',
        showNavigation: true,
        containerNoPadding: true
      }
    },
    {
      path: '/',
      name: 'Login',
      component: Login
    },
    {
      path: '*',
      redirect: '/'
    }
  ],
  scrollBehavior (to, from, savedPosition) {
    if (to.params.txId) {
      // Don't restore scroll for Transaction details screen
      return { x: 0, y: 0 }
    } else if (savedPosition) {
      return savedPosition
    } else if (to.meta.scrollPosition) {
      return to.meta.scrollPosition
    }
  }
})

router.beforeEach(IsLogged)
router.beforeEach(AuthMiddleware)
router.beforeEach(DocumentTitle)

export default router
