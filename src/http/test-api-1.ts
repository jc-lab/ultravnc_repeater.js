import {UltraVNCRepeater} from '../index';
import express from 'express';

export interface IConnectedPairItem {
  viewerConnectionId: string;
  serverConnectionId: string;
}

export interface IViewerConnection {
  remoteAddress: string;
  vncRemoteIdentity: string;
}

export interface IReverseServerConnection {
  remoteAddress: string;
  vncRemoteIdentity: string;
}

export interface IAllConnectionInfo {
  pairs: IConnectedPairItem[];
  viewerConnections: Record<string, IViewerConnection>;
  reverseServerConnections: Record<string, IReverseServerConnection>;
}

export function showAllConnections(repeater: UltraVNCRepeater, req: express.Request, res: express.Response, next: () => void) {
  const viewerConnections = repeater.viewerConnections;
  const reverseServerConnections = repeater.reverseServerConnections;
  const connectedPairs = repeater.connectedPairs;

  const payload: IAllConnectionInfo = {
    pairs: Object.keys(connectedPairs)
      .map(key => {
        const item = connectedPairs[key];
        return {
          viewerConnectionId: item.viewer.uniqueId,
          serverConnectionId: item.server.uniqueId
        };
      }),
    viewerConnections: Object.entries(viewerConnections.primaryMap)
      .reduce((result, cur) => {
        const socket = cur[1];
        result[cur[0]] = {
          remoteAddress: socket.value.socket.socket.remoteAddress && socket.value.socket.socket.remoteAddress.toString() || '',
          vncRemoteIdentity: socket.value.socket.vncRemoteIdentity
        };
        return result;
      }, {} as Record<string, IViewerConnection>),
    reverseServerConnections: Object.entries(reverseServerConnections.primaryMap)
      .reduce((result, cur) => {
        const socket = cur[1];
        result[cur[0]] = {
          remoteAddress: socket.value.socket.socket.remoteAddress && socket.value.socket.socket.remoteAddress.toString() || '',
          vncRemoteIdentity: socket.value.socket.vncRemoteIdentity
        };
        return result;
      }, {} as Record<string, IViewerConnection>)
  };

  res
    .status(200)
    .send(payload);
}
