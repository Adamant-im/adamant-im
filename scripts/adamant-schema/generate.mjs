import { $ } from 'execa'
import { resolve } from 'path'

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
