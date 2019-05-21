import { interval, from, of } from 'rxjs'
import { mergeMap, catchError } from 'rxjs/operators'

import store from '@/store'

export default {
  messageInterval: interval(3000)
    .pipe(mergeMap(() =>
      from(
        store.dispatch('chat/getNewMessages')
      ).pipe(catchError(err => of(err.message)))
    )),
  accountInterval: interval(20000),
  messageSubscription: null,
  accountSubscription: null,

  subscribe () {
    this.messageSubscription = this.messageInterval.subscribe(() => {})
    this.accountSubscription = this.accountInterval.subscribe(() => {
      store.dispatch('updateBalance')
    })
  },

  unsubscribe () {
    this.messageSubscription && this.messageSubscription.unsubscribe()
    this.accountSubscription && this.accountSubscription.unsubscribe()
  }
}
