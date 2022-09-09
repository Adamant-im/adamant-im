require('./indexedDB')

// This is a workaround to fix the tests that have the `vueBus` as an import.
// The functionality of `vueBus` should be rethinked or removed in the future.
//
// $on, $off and $once instance methods will be removed in Vue 3
// @see https://v3-migration.vuejs.org/breaking-changes/events-api.html
jest.mock('@/main', () => {})
