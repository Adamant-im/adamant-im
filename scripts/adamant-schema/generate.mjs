import { $ } from 'execa'
import { resolve } from 'path'

const args = {
  specFile: "https://schema.adamant.im/schema.json",
  generatorName: "typescript-axios",
  // Template
  // https://github.com/nicobao/openapi-generator/tree/master/samples/client/others/typescript-axios/with-separate-models-and-api-inheritance
  template: "typescript-axios",
  config: resolve("./src/lib/schema/config.json"),
  output: resolve("./src/lib/schema"),
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
