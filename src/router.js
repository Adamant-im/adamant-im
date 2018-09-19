import Vue from 'vue'
import Router from 'vue-router'

import Chats from '@/views/Chats'
import Chat from '@/views/Chat'
import Transfer from '@/views/Transfer'
import Transaction from '@/views/transactions/Transaction'
import Transactions from '@/views/Transactions'
import Options from '@/views/Options'
import Home from '@/views/Home'
import Votes from '@/views/Votes'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/votes',
      name: 'Votes',
      component: Votes,
      meta: { requiresAuth: true }
    },
    {
      path: '/transactions/:crypto/:tx_id',
      component: Transaction,
      name: 'Transaction',
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/transactions',
      name: 'Transactions',
      component: Transactions,
      meta: { requiresAuth: true }
    },
    {
      path: '/options',
      name: 'Options',
      component: Options,
      meta: { requiresAuth: true }
    },
    {
      path: '/chats/:partner/',
      component: Chat,
      name: 'Chat',
      meta: { requiresAuth: true }
    },
    {
      path: '/chats',
      name: 'Chats',
      component: Chats,
      meta: { requiresAuth: true }
    },
    {
      path: '/transfer/:fixedCrypto?/:fixedAddress?',
      name: 'Transfer',
      component: Transfer,
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/home',
      name: 'Home',
      component: Home,
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      name: 'Login',
      component: () => import(/* webpackChunkName: "login" */ '@/views/Login.vue')
    }
  ],
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  }
})
