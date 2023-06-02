import path from 'path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

/**
 * Exclude wordlists from `bip39` except for the english.json
 */
export function excludeBip39Wordlists() {
  const wordlistsPath = 'node_modules/bip39/src/wordlists'

  const filesToExclude = fs
    .readdirSync(path.resolve(__dirname, '../../',  wordlistsPath))
    .filter((fileName) => fileName !== 'english.json')

  return filesToExclude.map((fileName) =>
    fileURLToPath(new URL(`${wordlistsPath}/${fileName}`, import.meta.url))
  )
}
