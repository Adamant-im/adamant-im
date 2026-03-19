import { execa } from 'execa'
import { resolve } from 'path'
import process from 'node:process'

const schemaPath = './src/lib/schema'
const args = {
  specFile: resolve(schemaPath, 'schema.json'),
  generatorName: "typescript-axios",
  // @source https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator/src/main/resources/typescript-axios
  template: "typescript-axios",
  config: resolve(schemaPath, 'config.json'),
  output: resolve(schemaPath, './client'),
};

run()

async function run() {
  const cliArgs = [
    'generate',
    '--type-mappings',
    'Date=string',
    '--skip-validate-spec',
    '-i',
    args.specFile,
    '-g',
    args.generatorName,
    '-t',
    args.template,
    '-c',
    args.config,
    '-o',
    args.output,
  ]

  try {
    const { all = '' } = await execa('openapi-generator-cli', cliArgs, {
      all: true,
    })
    printWarningsAndErrors(all)
  } catch (error) {
    const output = [
      error?.all,
      error?.stderr,
      error?.stdout,
      error?.shortMessage,
      error?.message,
    ]
      .filter(Boolean)
      .join('\n')

    printWarningsAndErrors(output, true)
    throw error
  }
}

function printWarningsAndErrors(output, forceFallback = false) {
  const lines = (output || '')
    .split('\n')
    .filter((line) => /\b(WARN|ERROR)\b/.test(line))

  if (lines.length) {
    process.stdout.write(`${lines.join('\n')}\n`)
    return
  }

  if (forceFallback && output.trim()) {
    process.stderr.write(`${output}\n`)
  }
}
