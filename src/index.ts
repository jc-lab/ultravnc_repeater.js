import * as net from 'net';
import * as uuid from 'uuid';
import * as bunyan from 'bunyan';
import * as express from 'express';
import { Router } from 'express';

import {
  Settings
} from './config/settings';
import {ServerReverseSocket} from './server_reverse_socket';
import {ViewerSocket} from './viewer_socket';
import {DualKeyMap} from './dual_key_map';
import {RepeatPairWorker} from './repeat_pair_worker';

import {
  showAllConnections
} from './http/test-api-1';

interface IViewerConnectionCtx {
  socket: ViewerSocket;
  deferredNext: (() => void) | undefined;
}

interface IServerConnectionCtx {
  socket: ServerReverseSocket;
  deferredNext: (() => void) | undefined;
}

const logger = bunyan.createLogger({
  name: 'repeater'
});

export class UltraVNCRepeater {
  private _settings: Settings = new Settings();

  private _viewerConnections: DualKeyMap<string, string, IViewerConnectionCtx> = new DualKeyMap();
  private _reverseServerConnections: DualKeyMap<string, string, IServerConnectionCtx> = new DualKeyMap();
  private _connectedPairs: Record<string, RepeatPairWorker> = {};

  constructor() {
    this._settings.data = {
      mode1: false,
      mode2: true,
      portA: (process.env.PORT_A && parseInt(process.env.PORT_A)) || 5901,
      portB: (process.env.PORT_B && parseInt(process.env.PORT_B)) || 5500,
      keepalive: (process.env.VNC_KEEPALIVE && parseInt(process.env.VNC_KEEPALIVE)) || 10000,
      portHttp: (process.env.PORT_HTTP && parseInt(process.env.PORT_HTTP)) || 8080
    }
  }

  public get viewerConnections() {
    return this._viewerConnections;
  }
  public get reverseServerConnections() {
    return this._reverseServerConnections;
  }
  public get connectedPairs() {
    return this._connectedPairs;
  }

  public getSettings(): Settings {
    return this._settings;
  }

  public createHttpRouter(): Router {
    const router = Router();
    router.use(express.json());
    router.use(express.static('public'));
    router.get('/api/show-all-connections', showAllConnections.bind(null, this));
    return router;
  }

  public createServerA(): net.Server {
    const s = net.createServer();
    this.useServerA(s);
    return s;
  }

  public createServerB(): net.Server {
    const s = net.createServer();
    this.useServerB(s);
    return s;
  }

  public useServerA(serverSocket: net.Server) {
    serverSocket
      .on('error', (err) => {
        console.log('error', err);
      })
      .on('connection', (socket) => {
        const clientId = uuid.v4();
        logger.info({clientId}, 'viewer socket: connected');

        const instance = new ViewerSocket(this._settings, clientId, socket);
        instance.onHandshaked = (next) => {
          logger.info({
            clientId,
            remoteIdentifier: instance.vncRemoteIdentity
          }, 'viewer socket: handshaked');

          const ctx = this._viewerConnections.secondSetKey(clientId, instance.vncRemoteIdentity);
          if (ctx) {
            if (this.tryConnectPair(instance.vncRemoteIdentity, null, ctx)) {
              console.log('PAIR CONNECTED 1! ', instance.vncRemoteIdentity);
              next();
            } else {
              ctx.deferredNext = next;
            }
          } else {
            console.error('Unknown Error');
          }
        };
        instance
          .on('error', (err) => {
            logger.warn({err}, 'viewer socket: error');
          })
          .on('close', () => {
            const ctx = this._viewerConnections.primaryRemove(clientId);
            logger.info({clientId, ctxRemoved: !!ctx}, 'viewer socket: closed');
          });
        this._viewerConnections.set(clientId, undefined, {
          socket: instance,
          deferredNext: undefined
        });
      });
  }

  public useServerB(serverSocket: net.Server) {
    serverSocket
      .on('error', (err) => {
        console.log('error', err);
      })
      .on('connection', (socket) => {
        const clientId = uuid.v4();
        logger.info({clientId}, 'server reverse socket: connected');

        const instance = new ServerReverseSocket(this._settings, clientId, socket);
        instance.onHandshaked = (next) => {
          logger.info({
            clientId,
            remoteIdentifier: instance.vncRemoteIdentity
          }, 'server reverse socket: handshaked');

          const ctx = this._reverseServerConnections.secondSetKey(clientId, instance.vncRemoteIdentity);
          if (ctx) {
            if (this.tryConnectPair(instance.vncRemoteIdentity, ctx, null)) {
              console.log('PAIR CONNECTED 2! ', instance.vncRemoteIdentity);
              next();
            } else {
              ctx.deferredNext = next;
            }
          } else {
            console.error('Unknown Error');
          }
        };
        instance
          .on('error', (err) => {
            logger.warn({err}, 'server reverse socket: error');
          })
          .on('close', () => {
            const ctx = this._reverseServerConnections.primaryRemove(clientId);
            logger.info({clientId, ctxRemoved: !!ctx}, 'server reverse socket: closed');
          });
        this._reverseServerConnections.set(clientId, undefined, {
          socket: instance,
          deferredNext: undefined
        });
      });
  }

  public tryConnectPair(vncRemoteIdentity: string, _server: IServerConnectionCtx | null, _viewer: IViewerConnectionCtx | null): boolean {
    const server = _server || this._reverseServerConnections.secondGet(vncRemoteIdentity);
    const viewer = _viewer || this._viewerConnections.secondGet(vncRemoteIdentity);
    if (server && viewer) {
      if (server.socket.paired || viewer.socket.paired) {
        console.log('ALREADY PAIRED');
        return false;
      }

      if (server.deferredNext) {
        server.deferredNext();
        server.deferredNext = undefined;
      }
      if (viewer.deferredNext) {
        viewer.deferredNext();
        viewer.deferredNext = undefined;
      }
      const instance = RepeatPairWorker.create(vncRemoteIdentity, server.socket, viewer.socket);
      instance
        .on('close', () => {
          if (this._connectedPairs[vncRemoteIdentity] === instance) {
            delete this._connectedPairs[vncRemoteIdentity];
          }
        });
      this._connectedPairs[vncRemoteIdentity] = instance;
      return true;
    }
    return false;
  }
}
