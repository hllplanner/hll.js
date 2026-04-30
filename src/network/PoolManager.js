const RCONConnection = require("./RCONConnection");

/**
 * Manages a pool of RCON connections to distribute the message load.
 * @class
 */
class PoolManager {
  /** @type {Array<RCONConnection>} */
  connections = [];

  /** @type {RCONClient} */
  client = null;

  /** @type {number} */
  connectionsCount;

  /** @type {boolean} */
  isDestroyed = false;

  /**
   * @param {Object} options - The configuration options for the pool manager.
   * @param {RCONClient} options.client - The parent RCON client instance.
   * @param {number} [options.connectionsCount=2] - The number of connections to maintain in the pool.
   */
  constructor({ client, connectionsCount = 2 }) {
    this.client = client;
    this.connectionsCount = connectionsCount;
  }

  /**
   * Dedicated loop to continuously attempt reconnection until successful.
   * @private
   */
  async #reconnectSlot() {
    let reconnected = false;
    let attempt = 1;

    while (!reconnected && !this.isDestroyed) {
      // Wait 5 seconds between attempts
      await new Promise((r) => setTimeout(r, 5000));

      try {
        console.log(`Auto-recovery attempt ${attempt}...`);
        await this.#createConnection();
        reconnected = true;
        console.log("Auto-recovery successful. RCON connection restored.");
      } catch (err) {
        console.error(`Auto-recovery attempt ${attempt} failed:`, err.message);
        attempt++;
      }
    }
  }

  /**
   * Creates a new RCON connection and adds it to the pool once ready.
   * @private
   * @returns {Promise<void>}
   */
  async #createConnection() {
    return new Promise((resolve, reject) => {
      const connection = new RCONConnection({ client: this.client });
      let isReady = false;

      // Catch socket errors to prevent the Node.js process from crashing
      // The 'close' event will automatically fire immediately after this, only need this listener to omit the unhandled exception.
      connection.socket.once("error", () => null);

      connection.socket.once("close", async () => {
        // Always ensure the dead connection is removed from the active pool
        this.connections = this.connections.filter((c) => c !== connection);

        // Dont attempt to reestablish connection if client is destroyed.
        if (this.isDestroyed) return;

        if (!isReady) {
          // The socket died before it ever connected. Reject to prevent infinite hanging.
          reject(new Error("Failed to establish initial RCON connection."));
          return;
        }

        // The connection was previously healthy but dropped.
        console.warn("RCON connection dropped. Initiating auto-recovery...");
        this.#reconnectSlot();
      });

      connection.once("ready", () => {
        isReady = true;
        this.connections.push(connection);
        resolve();
      });

      connection.on("loginError", () => {
        if (this.client.listenerCount("loginError") > 0) {
          this.client.emit("loginError");
        } else {
          reject(new Error("Invalid RCON password."));
        }
      });
    });
  }

  /**
   * Initializes the connection pool by creating the specified number of connections.
   * @returns {Promise<void>}
   */
  async init() {
    for (let i = 0; i < this.connectionsCount; i++) {
      await this.#createConnection();
    }

    if (this.connections.length > 0) {
      this.client.emit("ready");
      this.client.connectionStatus = "ready";
    }
  }

  /**
   * Shuts down all active connections and prevents future reconnections.
   */
  disconnect() {
    this.isDestroyed = true;

    for (const connection of this.connections) {
      connection.disconnect();
    }

    this.connections = [];
  }

  /**
   * Retrieves the optimal connection based on current message load.
   * @private
   * @returns {RCONConnection} The connection to use for the next message.
   */
  #getOptimalConnection() {
    const connectionsSorted = this.connections.sort((a, b) => a.messagesInAir - b.messagesInAir);
    return connectionsSorted[0];
  }

  /**
   * Sends an RCON message using the optimal connection from the pool.
   * @param {Object} options - The message payload.
   * @param {string} options.name - Name of the command.
   * @param {Object} [options.contentBody] - The main content of the message.
   * @returns {Promise<ResponseMessage>} The response from the RCON server.
   * @throws {Error} Throws if there are no available connections in the pool.
   */
  async send({ name, contentBody }) {
    if (!this.connections.length) {
      throw new Error("No connections available.");
    }

    const connection = this.#getOptimalConnection();
    return connection.send({ name, contentBody });
  }
}

module.exports = PoolManager;