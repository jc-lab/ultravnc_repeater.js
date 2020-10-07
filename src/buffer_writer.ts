import {BufferReader} from "./buffer_reader";

export class BufferOverflowError extends Error {
  constructor() {
    super('BufferOverflowError');
  }
}

export class BufferWriter {
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

  public writeFromBuffer(buffer: Buffer, offset?: number, length?: number): void {
    const _offset = (typeof offset === 'undefined') ? 0 : offset;
    const _length = (typeof length === 'undefined') ? buffer.byteLength : length;
    this.verifyOverflow(_length);
    buffer.copy(this.buffer, this.offset, _offset, _offset + _length);
  }

  public writeFromReader(reader: BufferReader, length: number): void {
    reader.readToBuffer(this.buffer, this.offset, length);
    this.offset += length;
  }

  public writeFromReaderPartly(reader: BufferReader, maxLength: number): number {
    const length = reader.readToBufferPartly(this.buffer, this.offset, maxLength);
    this.offset += length;
    return length;
  }

  public readRemaining(): Buffer {
    const remaining = this.limit - this.offset;
    const target = Buffer.alloc(remaining);
    this.buffer.copy(target, 0, this.offset);
    this.offset += length;
    return target;
  }
}
