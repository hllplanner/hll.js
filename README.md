# hll.js

A comprehensive Node.js RCON client for Hell Let Loose.

### Installation

```
yarn add @finbar/hll.js
npm i @finbar/hll.js
```

### Features

- 100% RCON API Coverage
- High Traffic Concurrency: Connection Pooling & Multiple Messages in Transit
- Log Parsing

### Get Started

```js
const { RCONClient } = require("@finbar/hll.js");

const client = new RCONClient({
  host: "123.123.123.123",
  port: 7799,
  password: "PASSWORD"
});

client.on("ready", async () => {
  const session = await client.session.fetch();

  console.log(session);
  // #  {
  // #    serverName: 'RCON Testing',
  // #    mapName: 'ST MARIE DU MONT',
  // #    mapId: 'stmariedumont_warfare',
  // #    gameMode: 'Warfare',
  // #    remainingMatchTime: 0,
  // #    matchTime: 10200,
  // #    alliedFaction: 1,
  // #    axisFaction: 0,
  // #    alliedScore: 2,
  // #    axisScore: 2,
  // #    playerCount: 0,
  // #    alliedPlayerCount: 0,
  // #    axisPlayerCount: 0,
  // #    maxPlayerCount: 100,
  // #    queueCount: 0,
  // #    maxQueueCount: 6,
  // #    vipQueueCount: 2,
  // #    maxVipQueueCount: 0
  // #  }
});

(async () => {
  await client.init();
})();
```

### Error Paradigm

For many reasons, especially when polling any data, requests may be dropped by the server. It is suggested to wrap all
requests with the `safeRcon` function exported by this library.

Log polling performed by the RCONClient class by default uses this function.

```js
const { safeRcon } = require("@finbar/hll.js");

// Safely catch any errors from client.logs.fetch, if an error is encountered it will return an empty array.
const logs = await safeRcon(client.logs.fetch(3600), []);
if (logs.length <= 0) return; // Return if no logs were found
```