import loremIpsum from 'lorem-ipsum'

const userId = 'U9203183357885757380'

const partnerId = 'U15677078342684640219'
const partnerName = 'Uasya'

function randomDate (start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function createOneMessage () {
  return {
    type: Math.random() > 0.9 ? 'transaction' : 'message',
    userId,
    partnerId,
    partnerName,
    senderId: Math.random() > 0.5 ? userId : partnerId,
    timestamp: randomDate(new Date(2018, 9, 1), new Date()).getTime(),
    message: loremIpsum({
      count: 1,
      units: 'sentences',
      sentenceLowerBound: 5,
      sentenceUpperBound: 15,
      paragraphLowerBound: 3,
      paragraphUpperBound: 7,
      format: 'plain',
      random: Math.random
    })
  }
}

function createRandomMessages (count) {
  let messages = []

  for (let i = 0; i < count; i++) {
    messages.push(createOneMessage())
  }

  return messages.sort((a, b) => a.timestamp - b.timestamp)
}

const messages = createRandomMessages(100)

export {
  userId,
  partnerId,
  partnerName,
  messages
}
