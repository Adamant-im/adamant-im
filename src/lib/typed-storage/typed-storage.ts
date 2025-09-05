export class TypedStorage<K extends string, S = unknown> {
  constructor(
    private storageKey: K,
    private defaultValue: S,
    private storage: Storage
  ) {}

  getItem(): S {
    const rawData = this.storage.getItem(this.storageKey)
    if (rawData === null) {
      return this.defaultValue
    }

    try {
      return JSON.parse(rawData) ?? this.defaultValue
    } catch {
      this.storage.removeItem(this.storageKey)

      return this.defaultValue
    }
  }

  setItem(value: S) {
    const rawData = JSON.stringify(value)

    this.storage.setItem(this.storageKey, rawData)
  }

  removeItem() {
    this.storage.removeItem(this.storageKey)
  }
}
