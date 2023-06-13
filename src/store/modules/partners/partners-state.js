import { createPartnersListState } from './utils/createPartnersListState'

export default () => {
  return {
    lastChange: 0,
    lastUpdate: 0,
    list: createPartnersListState()
  }
}
