const sampleWords = [
  'adamant',
  'private',
  'message',
  'wallet',
  'secure',
  'network',
  'contact',
  'transaction'
]

const userId = 'U9203183357885757380'

const partnerId = 'U15677078342684640219'
const partnerName = 'Uasya'

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomMessage() {
  const wordCount = randomInt(5, 15)
  const words = Array.from(
    { length: wordCount },
    () => sampleWords[randomInt(0, sampleWords.length - 1)]
  )

  return `${words.join(' ')}.`
}

function createOneMessage() {
  return {
    type: Math.random() > 0.9 ? 'transaction' : 'message',
    userId,
    partnerId,
    partnerName,
    senderId: Math.random() > 0.5 ? userId : partnerId,
    timestamp: randomDate(new Date(2018, 9, 1), new Date()).getTime(),
    message: randomMessage()
  }
}

function createRandomMessages(count) {
  let messages = []

  for (let i = 0; i < count; i++) {
    messages.push(createOneMessage())
  }

  return messages.sort((a, b) => a.timestamp - b.timestamp)
}

const messages = createRandomMessages(100)

export { userId, partnerId, partnerName, messages }
