import Vue from 'vue'
import Router from 'vue-router'
import Hello from '@/components/Hello'
import Login from '@/components/Login'
import Chats from '@/components/Chats'
import Chat from '@/components/Chat'
import Transfer from '@/components/Transfer'
import Transaction from '@/components/Transaction'
import Transactions from '@/components/Transactions'
import Options from '@/components/Options'
import Home from '@/components/Home'
import QRScan from '@/components/QRScan'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/transactions/:crypto/:tx_id',
      component: Transaction,
      name: 'Transaction'
    },
    {
      path: '/transactions',
      name: 'Transactions',
      component: Transactions
    },
    {
      path: '/scan',
      name: 'QRScanner',
      component: QRScan
    },
    {
      path: '/hello',
      name: 'Hello',
      component: Hello
    },
    {
      path: '/options',
      name: 'Options',
      component: Options
    },
    { path: '/chats/:partner/', component: Chat },
    {
      path: '/chats',
      name: 'Chats',
      component: Chats
    },
    {
      path: '/transfer',
      name: 'Transfer',
      component: Transfer
    },
    {
      path: '/home',
      name: 'Home',
      component: Home
    },
    {
      path: '/',
      name: 'Login',
      component: Login
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
