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

  /**
   * Initializes the pool manager with a client and connection count.
   * @param {Object} options - The configuration options for the pool manager.
   * @param {RCONClient} options.client - The parent RCON client instance.
   * @param {number} [options.connectionsCount=2] - The number of connections to maintain in the pool.
   */
  constructor({ client, connectionsCount = 2 }) {
    this.client = client;
    this.connectionsCount = connectionsCount;
  }

  /**
   * Creates a new RCON connection and adds it to the pool once ready.
   * @private
   * @returns {Promise<void>}
   */
  async #createConnection() {
    return new Promise((resolve) => {
      const connection = new RCONConnection({ client: this.client });

      connection.on("ready", () => {
        this.connections.push(connection);
        resolve();
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
   * @param {string} [options.name] - Optional name of the command.
   * @param {string} [options.contentBody] - The main content of the message.
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