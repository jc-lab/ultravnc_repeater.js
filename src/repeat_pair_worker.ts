import * as events from 'events';

import {ServerReverseSocket} from './server_reverse_socket';
import {ViewerSocket} from './viewer_socket';

export interface IRepeatPairWorkerEvents extends events.EventEmitter {
  emit(event: string | symbol, ...args: any[]): boolean;
  emit(event: 'close'): boolean;

  on(event: string, listener: (...args: any[]) => void): this;
  on(event: 'close', listener: () => void): this;
}

export class RepeatPairWorker extends events.EventEmitter implements IRepeatPairWorkerEvents {
  private _remoteIdentity: string;
  private _server: ServerReverseSocket;
  private _viewer: ViewerSocket;
  private _closing: boolean = false;

  private constructor(remoteIdentity: string, server: ServerReverseSocket, viewer: ViewerSocket) {
    super();
    this._remoteIdentity = remoteIdentity;
    this._server = server;
    this._viewer = viewer;
    server.setPaired();
    viewer.setPaired();
    server.onData = (buffer, next) => {
      if (this._closing) {
        next();
        return ;
      }
      viewer.socket.write(buffer, next);
    };
    viewer.onData = (buffer, next) => {
      if (this._closing) {
        next();
        return ;
      }
      server.socket.write(buffer, next);
    };
    server.once('close', () => {
      console.log('server closed');
      if (!this._closing) {
        this.emit('close');
        viewer.close();
      }
      this._closing = true;
    });
    viewer.once('close', () => {
      console.log('viewer closed');
      if (!this._closing) {
        this.emit('close');
        server.close();
      }
      this._closing = true;
    });
  }

  public static create(remoteIdentity: string, server: ServerReverseSocket, viewer: ViewerSocket) {
    return new RepeatPairWorker(remoteIdentity, server, viewer);
  }

  public get remoteIdentity(): string {
    return this._remoteIdentity;
  }

  public get server() {
    return this._server;
  }

  public get viewer() {
    return this._viewer;
  }
}
