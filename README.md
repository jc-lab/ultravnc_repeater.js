# ultravnc_repeater.js

# Application Mode

Docker Image : [DockerHub `jclab/ultravnc_repeater`](#https://hub.docker.com/r/jclab/ultravnc_repeater)

## Environments

### PORT_A

Default: 5901

### PORT_B

Default: 5500

### PORT_HTTP

Default: 8080

### VNC_KEEPALIVE

Default: 10000 (ms)

# Mode

## Mode 1 (Currently not supported)
Allows for connection to multiple servers (in listen mode), using only one port. All connection data flows through the repeater, allowing connection to multiple servers through a single port forward or tunnel.

```
┌------------┐                    ┌----------┐              ┌------------┐
| VNC Viewer | ==Connect==> portA | REPEATER | ==Connect==> | VNC Server |
└------------┘                    └----------┘              └------------┘
``` 

## Mode 2
Allows both a Viewer and Server to connect together using the repeater as a PROXY. All connection data flows through the repeater, allowing both the server and viewer to be behind firewalls or routers.

```
┌------------┐                    ┌----------┐                    ┌------------┐
| VNC Viewer | ==Connect==> portA | REPEATER | portB <==Connect== | VNC Server |
└------------┘                    └----------┘                    └------------┘
```

# Library Mode

`npm install --save ultravnc_repeater`

(See [entry.ts](./src/entry.ts))

```typescript
import {
  UltraVNCRepeater
} from 'ultravnc_repeater';

import * as bunyan from 'bunyan';

import express from 'express';

const repeater = new UltraVNCRepeater();
const settings = repeater.getSettings();

const httpServer = express();
httpServer.use('/', repeater.createHttpRouter());
httpServer.listen(settings.portHttp);

const serverA = repeater.createServerA();
serverA.listen(settings.portA);

if (settings.mode2) {
  const serverB = repeater.createServerB();
  serverB.listen(settings.portB);
}
```
