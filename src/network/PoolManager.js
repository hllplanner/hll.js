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

  /** @type {Array<{}>} */
  messageQueue = [];

  /** @type {boolean} */
  isProcessingQueue = false;

  /** @type {number} */
  dispatchDelayMs = 30;

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
      // Pause between connection attempts
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
      connection.socket.once("error", () => null);

      connection.socket.once("close", async () => {
        connection.flushPendingRequests("Socket connection dropped.");

        this.connections = this.connections.filter((c) => c !== connection);

        if (this.isDestroyed) return;

        if (!isReady) {
          reject(new Error("Failed to establish initial RCON connection."));
          return;
        }

        console.warn("RCON connection dropped. Initiating auto-recovery...");
        await this.#reconnectSlot();
      });

      connection.once("ready", () => {
        isReady = true;
        this.connections.push(connection);

        // Resume processing the queue now that capacity is restored
        this.#startQueueProcessor();
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
   * Processes the global queue with rate limiting and concurrency checks.
   * @private
   */
  async #startQueueProcessor() {
    // Prevent overlapping processor loops
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.messageQueue.length > 0 && !this.isDestroyed) {
      const availableConnections = this.connections.filter(
        (c) => c.messagesInAir < c.maxMessagesInAir
      );

      if (availableConnections.length === 0) {
        // Yield briefly if pool is saturated or recovering
        await new Promise((r) => setTimeout(r, 50));
        continue;
      }

      availableConnections.sort((a, b) => a.messagesInAir - b.messagesInAir);
      const optimalConnection = availableConnections[0];

      const nextReq = this.messageQueue.shift();

      // Dispatch without awaiting the response to maintain throughput
      optimalConnection.send(nextReq.message)
        .then(nextReq.resolve)
        .catch(nextReq.reject);

      // Enforce dispatch delay to protect game server tick rate
      await new Promise((r) => setTimeout(r, this.dispatchDelayMs));
    }

    this.isProcessingQueue = false;
  }

  /**
   * Queues an RCON message to be sent when capacity is available.
   * @param {Object} options - The message payload.
   * @param {string} options.name - Name of the command.
   * @param {Object} [options.contentBody] - The main content of the message.
   * @returns {Promise<ResponseMessage>} The response from the RCON server.
   */
  async send({ name, contentBody }) {
    return new Promise((resolve, reject) => {
      this.messageQueue.push({
        message: { name, contentBody },
        resolve,
        reject
      });

      this.#startQueueProcessor();
    });
  }
}

module.exports = PoolManager;