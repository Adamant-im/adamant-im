import loremIpsum from 'lorem-ipsum'
import uuid from 'uuid'

const user = {
  id: 'U9203183357885757380',
  name: 'Rick Sanchez',
  pic: '/images/rick.png'
}

const partner = {
  id: 'U15677078342684640219',
  name: 'Morty Smith',
  pic: '/images/morty.png'
}

function randomDate (start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomTimestamp (startDate) {
  return randomDate(startDate, new Date()).getTime()
}

function randomMessage () {
  return loremIpsum({
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

function randomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomAmountADM (min, max) {
  return randomInt(min * 100000000, max * 100000000)
}

function createOneMessage () {
  return {
    id: uuid(),
    type: 'message',
    message: randomMessage(),
    timestamp: randomTimestamp(new Date(2018, 11, 1)),
    sender: Math.random() > 0.5 ? user : partner
  }
}

function createOneTransaction () {
  return {
    id: uuid(),
    type: 'transaction',
    message: randomMessage(),
    timestamp: randomTimestamp(new Date(2018, 11, 1)),
    sender: Math.random() > 0.5 ? user : partner,
    amount: randomAmountADM(1, 1000),
    currency: 'ADM'
  }
}

function createRandomMessages (count) {
  let messages = []
  let abstract = null

  for (let i = 0; i < count; i++) {
    if (Math.random() < 0.9) {
      abstract = createOneMessage()
    } else {
      abstract = createOneTransaction()
    }

    messages.push(abstract)
  }

  return messages.sort((a, b) => a.timestamp - b.timestamp)
}

const messages = createRandomMessages(100)

export {
  createRandomMessages,
  createOneMessage,
  messages,
  user
}
