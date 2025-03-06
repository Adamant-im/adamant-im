import BigNumber from 'bignumber.js';

type Endian = 1 | -1 | 'big' | 'little';

interface TransformBufferOptions {
  endian?: Endian;
  size?: number | 'auto';
}

type EndianMap = {
  [K in Endian]: 'big' | 'little';
};

const endianMap: EndianMap = {
  1: 'big',
  '-1': 'little',
  big: 'big',
  little: 'little',
};

export const fromBuffer = (buf: Buffer, opts: TransformBufferOptions = {}) => {
  const endian = resolveEndian(opts);

  const size = resolveSize(opts, buf.length);

  validateBufferLength(buf, size);

  const hex = bufferToHexArray(buf, size, endian);

  return new BigNumber(hex.join(''), 16);
};

export const toBuffer = (
  bignumber: BigNumber,
  opts: TransformBufferOptions | 'mpint' = {}
) => {
  if (typeof opts === 'string') {
    return toMpintBuffer(bignumber);
  }

  const endian = resolveEndian(opts);
  const hex = bignumberToHex(bignumber);

  const size = resolveSize(opts, hex.length / 2);

  return hexToBuffer(hex, size, endian);
};

export function resolveEndian(opts: TransformBufferOptions): Endian {
  if (!opts.endian) {
    return 'big';
  }

  return endianMap[opts.endian];
}

export function resolveSize(
  opts: TransformBufferOptions,
  defaultSize: number
): number {
  return opts.size === 'auto' ? Math.ceil(defaultSize) : opts.size || 1;
}

export function validateBufferLength(buf: Buffer, size: number) {
  if (buf.length % size !== 0) {
    throw new RangeError(
      `Buffer length (${buf.length}) must be a multiple of size (${size})`
    );
  }
}

export function bufferToHexArray(
  buf: Buffer,
  size: number,
  endian: Endian
): string[] {
  const hex: string[] = [];

  for (let i = 0; i < buf.length; i += size) {
    const chunk: string[] = [];
    for (let j = 0; j < size; j++) {
      const chunkIndex = endian === 'big' ? j : size - j - 1;
      chunk.push(buf[i + chunkIndex].toString(16).padStart(2, '0'));
    }
    hex.push(chunk.join(''));
  }

  return hex;
}

export function bignumberToHex(bignumber: BigNumber): string {
  const hex = bignumber.toString(16);
  if (hex.charAt(0) === '-') {
    throw new Error('Converting negative numbers to Buffers not supported yet');
  }
  return hex;
}

export function hexToBuffer(hex: string, size: number, endian: Endian): Buffer {
  const len = Math.ceil(hex.length / (2 * size)) * size;
  const buf = Buffer.alloc(len);

  while (hex.length < 2 * len) {
    hex = '0' + hex;
  }

  const hx = hex
    .split(new RegExp('(.{' + 2 * size + '})'))
    .filter(s => s.length > 0);

  hx.forEach((chunk, i) => {
    for (let j = 0; j < size; j++) {
      const ix = i * size + (endian === 'big' ? j : size - j - 1);
      buf[ix] = parseInt(chunk.slice(j * 2, j * 2 + 2), 16);
    }
  });

  return buf;
}

function toMpintBuffer(bignumber: BigNumber): Buffer {
  const buf = toBuffer(bignumber.abs(), {size: 1, endian: 'big'});

  let len = buf.length === 1 && buf[0] === 0 ? 0 : buf.length;

  if (buf[0] & 0x80) len++;

  const ret = Buffer.alloc(4 + len);
  if (len > 0) buf.copy(ret as Uint8Array , 4 + (buf[0] & 0x80 ? 1 : 0));
  if (buf[0] & 0x80) ret[4] = 0;

  ret[0] = len & (0xff << 24);
  ret[1] = len & (0xff << 16);
  ret[2] = len & (0xff << 8);
  ret[3] = len & (0xff << 0);

  // Two's compliment for negative integers
  const isNeg = bignumber.lt(0);
  if (isNeg) {
    for (let i = 4; i < ret.length; i++) {
      ret[i] = 0xff - ret[i];
    }
  }
  ret[4] = (ret[4] & 0x7f) | (isNeg ? 0x80 : 0);
  if (isNeg) ret[ret.length - 1]++;

  return ret;
}
