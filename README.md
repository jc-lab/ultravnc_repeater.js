# ultravnc_repeater.js

# Settings
## Mode

### Mode 1
Allows for connection to multiple servers (in listen mode), using only one port. All connection data flows through the repeater, allowing connection to multiple servers through a single port forward or tunnel.

```
┌------------┐                    ┌----------┐              ┌------------┐
| VNC Viewer | ==Connect==> portA | REPEATER | ==Connect==> | VNC Server |
└------------┘                    └----------┘              └------------┘
``` 

### Mode 2
Allows both a Viewer and Server to connect together using the repeater as a PROXY. All connection data flows through the repeater, allowing both the server and viewer to be behind firewalls or routers.

```
┌------------┐                    ┌----------┐                    ┌------------┐
| VNC Viewer | ==Connect==> portA | REPEATER | portB <==Connect== | VNC Server |
└------------┘                    └----------┘                    └------------┘
```

