# ADAMANT Messenger Progressive Web Application (PWA)

A messaging application client for ADAMANT Blockchain. See ADAMANT Project at [adamant.im](https://adamant.im).

ADAMANT is a decentralized anonymous messenger based on the blockchain system. It’s independent of any governments or corporations, and even developers due to the distributed network infrastructure that contains an open-source code.

The ADAMANT blockchain system belongs to its users. Nobody can control, block, deactivate, restrict or censor accounts. Users take full responsibility for their content, messages, media, and goals and intentions of using the messenger.

Privacy is the main concept of ADAMANT: neither phone numbers nor emails are required. Apps have no access to the contact list or geotags, IPs are hidden from chatters and paranoids can use [Tor app](http://adamant6457join2rxdkr2y7iqatar7n4n72lordxeknj435i4cjhpyd.onion).

All the messages are encrypted with the Diffie-Hellman Curve25519, Salsa20, Poly1305 algorithms and signed by SHA-256 + Ed25519 EdDSA. Private keys are never transferred to the network. The sequence of messages and their authenticity is guaranteed by the blockchain.

ADAMANT includes crypto wallets for ADAMANT (ADM), Bitcoin (BTC), Ethereum (ETH), Lisk (LSK), Dogecoin (DOGE) and Dash (DASH). Private keys for the wallets are derived from an ADAMANT passphrase. You can export the keys and use them in other wallets.

This application deployed at [msg.adamant.im](https://msg.adamant.im) and [available as standalone apps](https://adamant.im/#adm-apps) for macOS, Windows and Linux. Feel free to run your own messenger using this code and Build Setup.

ADAMANT Messenger has built-in crypto Exchanger and Adelina, an AI chat assistant based on ChatGPT.

## Project setup

```
yarn install
```

Note: Lisk libraries may ask for specific Node.js version, you can ignore this with `yarn install --ignore-engines`.

### Compiles and hot-reloads for development

```
yarn run serve
```

### Compiles and hot-reloads self-signed https-server for development

```
yarn run https
```

### Compiles and minifies for production

```
yarn run build
```

### Lints and fixes files

```
yarn run lint
```

### Run electron version

```
yarn run electron:serve
```

### Build electron version

```
yarn run electron:build
```

[Download pre-build apps](https://adamant.im/#adm-apps) for macOS, Windows and Linux.

#### Note for Windows users

To build on Windows you must install build tools for windows, it is easier to do this with [windows-build-tools](https://github.com/felixrieseberg/windows-build-tools) npm package.

For detailed explanation on how things work, checkout the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).
