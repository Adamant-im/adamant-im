import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import navigationGuard from '@/router/navigationGuard'

import IsLogged from '@/middlewares/isLogged'
import AuthMiddleware from '@/middlewares/auth'
import DocumentTitle from '@/middlewares/title'
import Chat from '@/views/Chat.vue'
import Chats from '@/views/Chats.vue'
import ExportKeys from '@/views/ExportKeys.vue'
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import Nodes from '@/views/Nodes.vue'
import Options from '@/views/Options.vue'
import SendFunds from '@/views/SendFunds.vue'
import Transaction from '@/views/transactions/Transaction.vue'
import Transactions from '@/views/Transactions.vue'
import Votes from '@/views/Votes.vue'
import Wallets from '@/views/Wallets.vue'
import Vibro from '@/views/Vibro.vue'
import WalletGuard from '@/middlewares/walletGuard'

/**
 * @type {Readonly<import("vue-router").RouteRecordRaw[]>}
 */
const routes = [
  {
    path: '/options/nodes',
    name: 'Nodes',
    component: Nodes,
    meta: {
      requiresAuth: false,
      layout: 'no-container',
      scrollPosition: {
        left: 0,
        top: 0
      }
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
    path: '/options/wallets',
    name: 'Wallets',
    component: Wallets,
    meta: {
      requiresAuth: true,
      layout: 'no-container',
      scrollPosition: {
        left: 0,
        top: 0
      }
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
        left: 0,
        top: 0
      }
    }
  },
  {
    path: '/chats',
    component: Chats, // Родительский компонент
    props: true,
    name: 'Chats',
    meta: {
      requiresAuth: true,
      layout: 'toolbar',
      containerNoPadding: true,
      showNavigation: true,
      scrollPosition: {
        left: 0,
        top: 0
      }
    },
    children: [
      {
        path: ':partnerId',
        component: Chat,
        name: 'Chat',
        props: true,
        meta: {
          requiresAuth: true,
          layout: 'chat'
        },
        beforeEnter: navigationGuard.chats
      }
    ]
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
      requiresWallets: true,
      layout: 'toolbar',
      showNavigation: true,
      containerNoPadding: true
    },
    beforeEnter: WalletGuard
  },
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  },
  {
    path: '/vibro',
    name: 'Vibro',
    component: Vibro
  }
]

const router = createRouter({
  history:
    process.env.VUE_APP_ELECTRON_MODE === 'production'
      ? createWebHashHistory()
      : createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.params.txId) {
      // Don't restore scroll for Transaction details screen
      return { left: 0, top: 0 }
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

export { router }
