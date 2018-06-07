export default {
  /**
   * Gets partner display name or `undefined` of one is not set
   */
  displayName: state => partner => state[partner] && state[partner].displayName
}
