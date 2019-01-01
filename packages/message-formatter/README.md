# Message formatter

Message formatter for Adamant chat

## Installation

```shell
# yarn
yarn add file:packages/message-formatter
```

```shell
# npm
npm i --save file:packages/message-formatter
```

## Format message

```js
import { formatMessage } from '@adamant/message-formatter'

const message = `
  To bold, surround your text with asterisks: *your text*
                   
  To italicize, surround your text with underscores: _your text_
  
  To strikethrough, surround your text with tildes: ~your text~
  
  `Format one word or one line`
  
  ```Format blocks of text```
  
  paragraph
  
  link https://google.com
  email team@adamant.im
`

const messageFormatted = formatMessage(message)
```

#### Output
```html
  <p>To bold, surround your text with asterisks: <strong>your text</strong></p>
                   
  <p>To italicize, surround your text with underscores: <i>your text</i></p>
  
  <p>To strikethrough, surround your text with tildes: <strike>your text</strike></p>
  
  <code>Format one word or one line</code>
  
  <pre>Format blocks of text</pre>
  
  <p>paragraph</p>
  
  <p>link <a href="https://google.com">https://google.com</a></p>
  <p>email <a href="mailto:team@adamant.im">team@adamant.im</a></p>
```

**Important**: `formatMessage` also sanitize html by replacing these chars:

```js
const entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '=': '&#x3D;'
}
```

## Remove formats

Sometimes you need plain text without formats, for example for Chat Preview Message.

```js
import { removeFormats } from '@adamant/message-formatter'

const message = `Lorem *ipsum* dolor sit _amet_, consectetur ~adipiscing~ elit.`

const messageWithoutFormats = removeFormats(message)
```

#### Output
```html
Lorem ipsum dolor sit amet, consectetur adipiscing elit.
```
