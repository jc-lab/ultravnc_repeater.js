import * as events from 'events';
import * as net from 'net';
import {BufferReader} from './buffer_reader';
import {BufferWriter} from './buffer_writer';
import {
  RFB_PORT_OFFSET,
  MAX_HOST_NAME_LEN
} from './constants';

export interface IServerReverseSocketEvents extends events.EventEmitter {
  emit(event: string | symbol, ...args: any[]): boolean;
  emit(event: 'close'): boolean;

  on(event: string, listener: (...args: any[]) => void): this;
  on(event: 'close', listener: () => void): this;
}

enum HandshakeState {
  readSettings,
  working
}

export class ServerReverseSocket extends events.EventEmitter implements IServerReverseSocketEvents  {
  private readonly _uniqueId: string;
  private readonly _socket: net.Socket;
  private _closing: boolean = false;

  private _handshakeState: HandshakeState;

  private _readingBuffer: BufferWriter | null = null;
  private _vncRemoteHost!: string;
  private _vncRemotePort!: number;

  private _paired: boolean = false;

  public onHandshaked: (next: () => void) => void = (next) => next();
  public onData: (buffer: Buffer, next: (err?: any) => void) => void = (buffer, next) => next();

  constructor(uniqueId: string, socket: net.Socket) {
    super();
    this._uniqueId = uniqueId;
    this._socket = socket;
    this._handshakeState = HandshakeState.readSettings;
    this._readingBuffer = null;
    socket
      .on('close', (hasError) => {
        this._closing = true;
        this.emit('close');
      })
      .on('error', (err) => {
        this.close();
      })
      .on('data', (buffer: Buffer) => {
        const readBuffer = new BufferReader(buffer);

        const done = () => {
          socket.resume();
        };
        const exec = () => {
          socket.pause();
          if (readBuffer.remaining <= 0) {
            done();
            return ;
          }
          switch (this._handshakeState) {
            case HandshakeState.readSettings:
              if (!this._readingBuffer) {
                this._readingBuffer = new BufferWriter(Buffer.alloc(MAX_HOST_NAME_LEN));
              }
              this._readingBuffer.writeFromReaderPartly(readBuffer, this._readingBuffer.remaining);
              if (this._readingBuffer.remaining === 0) {
                if (!this.parseSettings(this._readingBuffer.buffer)) {
                  socket.end();
                  done();
                  return ;
                }
                this._readingBuffer = null;
                this._handshakeState = HandshakeState.working;
                this.onHandshaked(exec);
                return ;
              }
              break;
            case HandshakeState.working:
              this.onData(readBuffer.readRemaining(), (err) => {
                if (err) {
                  this._socket.emit('error', err);
                }
                done();
              });
              return ;
          }
          exec();
        };
        exec();
      });
  }

  public get uniqueId(): string {
    return this._uniqueId;
  }

  public get socket(): net.Socket {
    return this._socket;
  }

  public get paired(): boolean {
    return this._paired;
  }

  public setPaired(): void {
    this._paired = true;
  }

  public close(): void {
    this._closing = true;
    this._socket.end();
  }

  private parseSettings(buffer: Buffer) {
    const CHAR_COLON = ':'.charCodeAt(0);
    const colonpos = buffer.findIndex((v) => v == CHAR_COLON);
    let tmpPort: number = 0;
    if (colonpos < 0) {
      // No colon: Use default port number.
      tmpPort = RFB_PORT_OFFSET;
      this._vncRemoteHost = (new BufferReader(buffer)).readNullTerminatedString();
    } else {
      this._vncRemoteHost = buffer.slice(0, colonpos).toString();

      const portReader = new BufferReader(buffer);
      if (buffer[colonpos + 1] === CHAR_COLON) {
        // Two Colon: interpret as a port number
        portReader.offset = colonpos + 2;
      } else {
        // One colon: interpret as a display number or port number
        portReader.offset = colonpos + 1;
      }
      tmpPort = parseInt(portReader.readWithFilter(v => v >= 0x30 && v < 0x40).toString());
      if (isNaN(tmpPort)) {
        return false;
      }
      if (buffer[colonpos + 1] != CHAR_COLON && tmpPort < 100) {
        // RealVNC method: If port < 100 interpret as display number else as port number
        tmpPort += RFB_PORT_OFFSET;
      }
    }
    this._vncRemotePort = tmpPort;
    return true;
  }

  public get vncRemoteHost() {
    return this._vncRemoteHost;
  }

  public get vncRemotePort() {
    return this._vncRemotePort;
  }

  public get vncRemoteIdentity(): string {
    return this._vncRemoteHost + ':' + this._vncRemotePort;
  }
}
