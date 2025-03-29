'use strict'

/**
 * Buffer functions that implements bignumber.
 * @memberof module:helpers
 * @requires bignumber
 * @constructor
 */
import BigNumber from 'bignumber.js'

/**
 * Creates an instance from a Buffer.
 * @param {ArrayBuffer} buf
 * @param {Object} opts
 * @return {ArrayBuffer} new BigNumber instance
 * @throws {RangeError} error description multiple of size
 */
BigNumber.fromBuffer = function (buf, opts) {
  if (!opts) opts = {}

  const endian = { 1: 'big', '-1': 'little' }[opts.endian] || opts.endian || 'big'

  const size = opts.size === 'auto' ? Math.ceil(buf.length) : opts.size || 1

  if (buf.length % size !== 0) {
    throw new RangeError(
      'Buffer length (' + buf.length + ')' + ' must be a multiple of size (' + size + ')'
    )
  }

  const hex = []
  for (let i = 0; i < buf.length; i += size) {
    const chunk = []
    for (let j = 0; j < size; j++) {
      chunk.push(buf[i + (endian === 'big' ? j : size - j - 1)])
    }

    hex.push(
      chunk
        .map(function (c) {
          return (c < 16 ? '0' : '') + c.toString(16)
        })
        .join('')
    )
  }

  return new BigNumber(hex.join(''), 16)
}

/**
 * Returns an instance as Buffer.
 * @param {Object} opts
 * @return {ArrayBuffer} new buffer | error message invalid option
 */
BigNumber.prototype.toBuffer = function (opts) {
  let buf, len
  if (typeof opts === 'string') {
    if (opts !== 'mpint') return 'Unsupported Buffer representation'

    const abs = this.abs()
    buf = abs.toBuffer({ size: 1, endian: 'big' })
    len = buf.length === 1 && buf[0] === 0 ? 0 : buf.length
    if (buf[0] & 0x80) len++

    const ret = Buffer.alloc(4 + len)
    if (len > 0) buf.copy(ret, 4 + (buf[0] & 0x80 ? 1 : 0))
    if (buf[0] & 0x80) ret[4] = 0

    ret[0] = len & (0xff << 24)
    ret[1] = len & (0xff << 16)
    ret[2] = len & (0xff << 8)
    ret[3] = len & (0xff << 0)

    // Two's compliment for negative integers
    const isNeg = this.lt(0)
    if (isNeg) {
      for (let i = 4; i < ret.length; i++) {
        ret[i] = 0xff - ret[i]
      }
    }
    ret[4] = (ret[4] & 0x7f) | (isNeg ? 0x80 : 0)
    if (isNeg) ret[ret.length - 1]++

    return ret
  }

  if (!opts) opts = {}

  const endian = { 1: 'big', '-1': 'little' }[opts.endian] || opts.endian || 'big'

  let hex = this.toString(16)
  if (hex.charAt(0) === '-') {
    throw new Error('Converting negative numbers to Buffers not supported yet')
  }

  const size = opts.size === 'auto' ? Math.ceil(hex.length / 2) : opts.size || 1

  len = Math.ceil(hex.length / (2 * size)) * size
  buf = Buffer.alloc(len)

  // Zero-pad the hex string so the chunks are all `size` long
  while (hex.length < 2 * len) hex = '0' + hex

  const hx = hex.split(new RegExp('(.{' + 2 * size + '})')).filter(function (s) {
    return s.length > 0
  })

  hx.forEach(function (chunk, i) {
    for (let j = 0; j < size; j++) {
      const ix = i * size + (endian === 'big' ? j : size - j - 1)
      buf[ix] = parseInt(chunk.slice(j * 2, j * 2 + 2), 16)
    }
  })

  return buf
}

export { BigNumber }
