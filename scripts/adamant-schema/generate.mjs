import { $ } from 'execa'
import { resolve } from 'path'

const schemaPath = './src/lib/schema'
const args = {
  specFile: resolve(schemaPath, 'schema.json'),
  generatorName: "typescript-axios",
  // Template
  // https://github.com/nicobao/openapi-generator/tree/master/samples/client/others/typescript-axios/with-separate-models-and-api-inheritance
  template: "typescript-axios",
  config: resolve(schemaPath, 'config.json'),
  output: resolve(schemaPath),
};

run()

async function run() {
  const $$ = $({ shell: true, stdout: 'inherit' })

  const cliArgs = [
    `--type-mappings Date=string`,
    `--skip-validate-spec`,
    `-i ${args.specFile}`,
    `-g ${args.generatorName}`,
    `-t ${args.template}`,
    `-c ${args.config}`,
    `-o ${args.output}`,
  ]
  await $$`openapi-generator-cli generate ${cliArgs}`
}
