require('./indexedDB')

// This is a workaround to fix the tests that have the `vueBus` as an import.
// The functionality of `vueBus` should be rethinked or removed in the future.
jest.mock('@/main', () => {})
