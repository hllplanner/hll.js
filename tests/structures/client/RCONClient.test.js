const { RCONClient } = require("../../../src");
require("dotenv").config({ quiet: true });

describe("Invalid Password Without Handler", () => {
  let client;

  beforeAll(async () => {
    client = new RCONClient({
      host: process.env.RCON_HOST,
      port: process.env.RCON_PORT,
      password: process.env.RCON_PASSWORD + "1"
    });
  });

  afterAll(() => {
    // Destroy all active sockets so the Jest process can exit cleanly
    client.disconnect();
  });

  describe("Connection Attempt", () => {
    it("should fail hard", async () => {
      // Use .rejects.toThrow() and await the expectation for async functions
      await expect(client.init()).rejects.toThrow("Invalid RCON password");
    });
  });
});

describe("Invalid Password With Handler", () => {
  let client;

  beforeAll(async () => {
    client = new RCONClient({
      host: process.env.RCON_HOST,
      port: process.env.RCON_PORT,
      password: process.env.RCON_PASSWORD + "1"
    });
  });

  afterAll(() => {
    client.disconnect();
  });

  describe("Connection Attempt", () => {
    it("should emit 'loginError' instead of throwing an error", async () => {
      const loginErrorMock = jest.fn();

      // Create a promise that resolves specifically when the event is emitted
      const eventFired = new Promise((resolve) => {
        client.on("loginError", () => {
          loginErrorMock();
          resolve();
        });
      });

      // Execute init without awaiting it so the test does not hang
      client.init().catch(() => {});

      // Await our custom promise instead
      await eventFired;

      expect(loginErrorMock).toHaveBeenCalled();
      expect(loginErrorMock).toHaveBeenCalledTimes(1);
    });
  });
});

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