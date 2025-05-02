import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import navigationGuard from '@/router/navigationGuard'

import IsLogged from '@/middlewares/isLogged'
import AuthMiddleware from '@/middlewares/auth'
import DocumentTitle from '@/middlewares/title'
import Chat from '@/views/Chat.vue'

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
import ExportKeysForm from '@/views/ExportKeysForm.vue'
import AppSidebar from '@/views/AppSidebar.vue'

/**
 * @type {Readonly<import("vue-router").RouteRecordRaw[]>}
 */
const routes = [
  {
    path: '/chats',
    component: AppSidebar,
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
          requiresAuth: true
        },
        beforeEnter: navigationGuard.chats
      }
    ]
  },
  {
    path: '/home',
    name: 'Home',
    component: AppSidebar,
    meta: {
      requiresAuth: true,
      requiresWallets: true,
      layout: 'toolbar',
      showNavigation: true,
      containerNoPadding: true
    },
    beforeEnter: WalletGuard,
    children: [
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
        },
        children: [
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
            component: ExportKeysForm,
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
          }
        ]
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
        beforeEnter: navigationGuard.transactions,
        children: [
          {
            path: ':txId',
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
      }
    ]
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
    import.meta.env.VITE_ROUTER_HISTORY_MODE === 'hash'
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
