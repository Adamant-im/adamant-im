import {readdir, readFile, writeFile} from 'fs/promises';
import {resolve, join} from 'path';

import { Cryptos as SupportedCryptos } from '../src/lib/constants/cryptos/index.js'

const forEachDir = async (path, callback) => {
  const dirents = await readdir(path, {
    withFileTypes: true
  });

  const promises = dirents
    .filter((dir) => dir.isDirectory())
    .map(callback);

  await Promise.all(promises);
}

const parseJsonFile = async (path) => {
  const json = await readFile(path, 'utf-8');

  return JSON.parse(json);
}

const initCoins = async () => {
  const coins = {};
  const symbols = {};

  const generalAssetsPath = resolve(
    'adamant-wallets',
    'assets',
    'general'
  );

  await forEachDir(generalAssetsPath, async ({ name }) => {
    const path = join(generalAssetsPath, name, 'info.json');

    const coin = await parseJsonFile(path)

    if (!SupportedCryptos[coin.symbol]) {
      return;
    }

    symbols[name] = coin.symbol;

    coins[coin.symbol] = {
      symbol: coin.symbol,
      name: coin.name,
      qrPrefix: coin.qqPrefix,
      minBalance: coin.minBalance,
      regexAddress: coin.regexAddress,
      decimals: coin.decimals,
      minTransferAmount: coin.minTransferAmount,
      contractId: coin.contractId,
      nodes: coin.nodes,
      createCoin: coin.createCoin,
      cryptoTransferDecimals: coin.cryptoTransferDecimals,
      defaultFee: coin.defaultFee
    };
  });

  return [coins, symbols];
}

const applyBlockchains = async (coins, symbols) => {
  const blockchainsPath = resolve(
    'adamant-wallets',
    'assets',
    'blockchains'
  );

  await forEachDir(blockchainsPath, async ({ name: blockchainName }) => {
    const blockchainPath = join(blockchainsPath, blockchainName);
    const infoPath = join(blockchainPath, 'info.json');

    const info = await parseJsonFile(infoPath);

    await forEachDir(blockchainPath, async ({ name: coinName }) => {
      const coinPath = join(blockchainPath, coinName, 'info.json');
      const coin = await parseJsonFile(coinPath);

      if (!coins[coin.symbol]) {
        return;
      }

      coins[coin.symbol] = {
        ...coins[coin.symbol],
        ...coin,
        type: info.type,
        defaultGasLimit: info.defaultGasLimit,
        fees: info.fees
      }
    });
  });
}

const [coins, symbols] = await initCoins();

await applyBlockchains(coins, symbols);

await writeFile(
    resolve('src', 'lib', 'constants', 'cryptos', 'data.json'),
    JSON.stringify(coins, null, 2),
);
