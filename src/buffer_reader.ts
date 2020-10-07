export class BufferOverflowError extends Error {
  constructor() {
    super('BufferOverflowError');
  }
}

export class BufferReader {
  public buffer: Buffer;
  public offset: number;
  public limit: number;

  public constructor(buffer: Buffer) {
    this.buffer = buffer;
    this.offset = 0;
    this.limit = buffer.byteLength;
  }

  public get remaining(): number {
    return this.limit - this.offset;
  }

  public checkOverflow(length: number): boolean {
    return (length + this.offset) > this.limit;
  }

  public verifyOverflow(length: number): void {
    if (this.checkOverflow(length)) {
      throw new BufferOverflowError();
    }
  }

  public skip(length: number): void {
    this.verifyOverflow(length);
    this.offset += length;
  }

  public readBuffer(length: number): Buffer {
    this.verifyOverflow(length);
    const target = Buffer.alloc(length);
    this.buffer.copy(target, 0, this.offset);
    this.offset += length;
    return target;
  }

  public readToBuffer(buffer: Buffer, offset?: number, length?: number): void {
    const _offset = (typeof offset === 'undefined') ? 0 : offset;
    const _length = (typeof length === 'undefined') ? buffer.byteLength : length;
    this.verifyOverflow(_length);
    if (buffer.byteLength < (_offset + _length)) {
      throw new BufferOverflowError();
    }
    this.buffer.copy(buffer, _offset, this.offset, this.offset + _length);
  }

  public readToBufferPartly(buffer: Buffer, offset?: number, maxLength?: number): number {
    const _offset = (typeof offset === 'undefined') ? 0 : offset;
    const _length = Math.min((typeof maxLength === 'undefined') ? buffer.byteLength : maxLength, this.remaining);
    this.verifyOverflow(_length);
    if (buffer.byteLength < (_offset + _length)) {
      throw new BufferOverflowError();
    }
    this.buffer.copy(buffer, _offset, this.offset, this.offset + _length);
    this.offset += _length;
    return _length;
  }

  public readRemaining(): Buffer {
    const remaining = this.limit - this.offset;
    const target = Buffer.alloc(remaining);
    this.buffer.copy(target, 0, this.offset);
    this.offset += remaining;
    return target;
  }

  public readNullTerminatedString(encoding?: BufferEncoding): string {
    let position = this.offset;
    while (position < this.limit && this.buffer[position] != 0) {
      position++;
    }
    const text = this.buffer.slice(this.offset, position).toString(encoding);
    this.offset = position;
    return text;
  }

  public readWithFilter(filter: (v: number, index: number) => boolean): Buffer {
    let position = this.offset;
    while (position < this.limit && filter(this.buffer[position], position - this.offset)) {
      position++;
    }
    const data = this.buffer.slice(this.offset, position);
    this.offset = position;
    return data;
  }
}
