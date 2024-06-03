export const toLocalCurrency = (amount: number | string, locale: string, options?: object) => {
  return new Intl.NumberFormat(locale, options).format(Number(amount))
}
