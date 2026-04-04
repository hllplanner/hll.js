const { RCONClient } = require("../../../src");
require("dotenv").config();

describe("RCONClient", () => {
  let client;

  beforeAll(async () => {
    client = new RCONClient({
      host: process.env.RCON_HOST,
      port: process.env.RCON_PORT,
      password: process.env.RCON_PASSWORD
    });

    await client.init();
  });

  afterAll(() => {
    // Destroy all active sockets so the Jest process can exit cleanly
    client.disconnect();
  });

  describe("Connection Recovery", () => {
    // Increase the timeout for this test block to 10 seconds to accommodate the 5000ms reconnect delay
    it("should automatically reconnect a dropped connection", async () => {
      const initialCount = client.pool.connectionsCount;
      expect(client.pool.connections.length).toBe(initialCount);

      // Grab the first active connection and forcibly terminate its TCP socket
      const targetConnection = client.pool.connections[0];
      targetConnection.socket.destroy();

      // Allow the Node.js event loop a brief moment to process the 'close' event and remove it from the pool
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify the connection was actually removed from the active pool array
      expect(client.pool.connections.length).toBe(initialCount - 1);

      // The PoolManager waits 5000ms before initiating the background reconnection.
      // We wait 6000ms to ensure the timeout finishes and the new connection has time to authenticate.
      await new Promise((resolve) => setTimeout(resolve, 6000));

      // Verify the pool has recovered back to its target connection count
      expect(client.pool.connections.length).toBe(initialCount);
    }, 10000);
  });
});