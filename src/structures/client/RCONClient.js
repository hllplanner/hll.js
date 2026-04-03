const { EventEmitter } = require("node:events");
const PoolManager = require("../network/PoolManager");
const PlayerManager = require("../managers/PlayerManager");

/**
 * Represents the RCON client, its connections, and managers.
 *
 * @class
 * @extends EventEmitter
 */
class RCONClient extends EventEmitter {
  /** @type {PoolManager} */
  pool;

  /** @type {string} */
  host;

  /** @type {number} */
  port;

  /** @type {string} */
  password;

  /** @type {PlayerManager} */
  players;

  /**
   * @param {Object} options - The connection parameters.
   * @param {string} [options.host] - RCON server host.
   * @param {number} [options.port] - RCON server port.
   * @param {string} [options.password] - RCON server password.
   */
  constructor({ host, port, password }) {
    super();

    this.host = host;
    this.port = port;
    this.password = password;

    this.players = new PlayerManager(this);
  }

  /**
   * Initializes the RCON pool.
   *
   * @param {Object} options - The pool parameters.
   * @param {number} [options.connectionsCount=2] - The number of RCON connections to maintain.
   * @returns {Promise<void>}
   */
  async init(options = {}) {
    this.pool = new PoolManager({ client: this, connectionsCount: options.connectionsCount });

    await this.pool.init();
  }

  /**
   * Sends an RCON message.
   *
   * @param {Object} options - The message options.
   * @param {string} [options.name] - Optional name of the command.
   * @param {Object} [options.contentBody] - The main content of the message.
   * @returns {Promise<ResponseMessage>}
   */
  async send(options) {
    return this.pool.send({ name: options.name, contentBody: options.contentBody });
  }
}

module.exports = RCONClient;