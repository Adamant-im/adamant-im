/**
 * The code is based on https://github.com/Consensys/abi-decoder
 */
import type { Components, JsonEventInterface, JsonFunctionInterface } from 'web3-types'
import { sha3 } from 'web3-utils'
import { decodeParameters } from 'web3-eth-abi'
import BigNumber from 'bignumber.js'

type Method = {
  name: string
  params: MethodsParams[]
}

type MethodsParams = {
  name: string
  type: string
  value: string | string[]
}

function componentType(input: Components): string {
  if (input.type === 'tuple') {
    const tupleTypes = input.components!.map(componentType)

    return '(' + tupleTypes.join(',') + ')'
  }

  return input.type
}

/**
 * Returns `true` if the input type is one of:
 * uint, uint8, uint16, uint32, uint64, uint128, uint256
 */
function isUint(input: Components) {
  return input.type.startsWith('uint')
}

/**
 * Returns `true` if the input type is one of:
 * int, int8, int16, int32, int64, int128, int256
 */
function isInt(input: Components) {
  return input.type.startsWith('int')
}

/**
 * Returns `true` if the input is an ETH address
 */
function isAddress(input: Components) {
  return input.type === 'address'
}

export class AbiDecoder {
  readonly schema: Array<JsonFunctionInterface | JsonEventInterface>
  readonly methods: Record<string, JsonFunctionInterface | JsonEventInterface>

  constructor(schema: Array<JsonFunctionInterface | JsonEventInterface>) {
    this.schema = schema
    this.methods = this.parseMethods()
  }

  decodeMethod(data: string) {
    const methodId = data.slice(2, 10)
    const abiItem = this.methods[methodId]
    if (abiItem) {
      const decodedParams = decodeParameters(abiItem.inputs, data.slice(10))

      const retData: Method = {
        name: abiItem.name,
        params: []
      }

      for (let i = 0; i < decodedParams.__length__; i++) {
        const param = decodedParams[i] as string | string[]
        let parsedParam = param

        const input = abiItem.inputs[i]

        if (isInt(input) || isUint(input)) {
          const isArray = Array.isArray(param)

          if (isArray) {
            parsedParam = param.map((number) => new BigNumber(number).toString())
          } else {
            parsedParam = new BigNumber(param).toString()
          }
        }

        // Addresses returned by web3 are randomly cased, so we need to standardize and lowercase all
        if (isAddress(input)) {
          const isArray = Array.isArray(param)

          if (isArray) {
            parsedParam = param.map((address) => address.toLowerCase())
          } else {
            parsedParam = param.toLowerCase()
          }
        }

        retData.params.push({
          name: input.name,
          value: parsedParam,
          type: input.type
        })
      }

      return retData
    }
  }

  methodName(data: string): string | null {
    const methodId = data.slice(2, 10)
    const method = this.methods[methodId]

    return method ? method.name : null
  }

  private parseMethods(): Record<string, JsonFunctionInterface | JsonEventInterface> {
    const methods: Record<string, JsonFunctionInterface | JsonEventInterface> = {}

    for (const abi of this.schema) {
      if (!abi.name) {
        continue
      }

      const inputTypes = abi.inputs.map(componentType)
      const signature = sha3(abi.name + '(' + inputTypes.join(',') + ')') as string

      const methodId = abi.type === 'event' ? signature.slice(2) : signature.slice(2, 10) // event | function

      methods[methodId] = abi
    }

    return methods
  }
}
