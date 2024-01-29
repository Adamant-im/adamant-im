export default function truncateString(
  num: string | number,
  firstCharCount = 1,
  endCharCount = 3,
  dotCount = 3
) {
  const stringifiedNumber = num.toString()
  const decimalPart = stringifiedNumber.split('.').pop()

  if (
    typeof decimalPart === 'undefined' ||
    (decimalPart && decimalPart.length <= firstCharCount + endCharCount)
  ) {
    return stringifiedNumber
  }

  const firstPortion = stringifiedNumber.slice(0, firstCharCount)
  const endPortion = stringifiedNumber.slice(-endCharCount)
  const dots = '.'.repeat(dotCount)

  return `${firstPortion}${dots}${endPortion}`
}
