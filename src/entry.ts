import {
  UltraVNCRepeater
} from './index';

import * as bunyan from 'bunyan';
import expressBunyanLogger from './http/http-logger';

import express from 'express';

const repeater = new UltraVNCRepeater();
const settings = repeater.getSettings();

const httpServer = express();
httpServer.use(expressBunyanLogger({
  format: ':method :url HTTP/:http-version :status-code :res-headers[content-length] :referer :user-agent[family] :user-agent[major].:user-agent[minor] :user-agent[os] :response-time ms',
  serializers: {
    err: bunyan.stdSerializers.err,
    req: () => undefined,
    res: () => undefined
  }
}));
httpServer.use('/', repeater.createHttpRouter());
httpServer.listen(82);

const serverA = repeater.createServerA();
serverA.listen(settings.portA);

if (settings.mode2) {
  const serverB = repeater.createServerB();
  serverB.listen(settings.portB);
}
