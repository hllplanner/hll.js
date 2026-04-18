const { EventEmitter } = require("node:events");

const LogManager = require("../managers/LogManager");
const MapManager = require("../managers/MapManager");
const PlayerManager = require("../managers/PlayerManager");
const PoolManager = require("../network/PoolManager");
const ServerManager = require("../managers/ServerManager");
const SessionManager = require("../managers/SessionManager");

/**
 * @typedef {Object} RconCommandDialogueParameter
 * @property {string} type
 * @property {string} name
 * @property {string} id
 * @property {string} displayMember
 * @property {string} valueMember
 */

/**
 * @typedef {Object} RCONCommandInformation
 * @property {string} name
 * @property {string} text
 * @property {string} description
 * @property {Array<RconCommandDialogueParameter>} dialogueParameters
 */

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

  /** @type {LogManager} */
  logs;

  /** @type {MapManager} */
  maps;

  /** @type {PlayerManager} */
  players;

  /** @type {SessionManager} */
  session;

  /** @type {ServerManager} */
  server;

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

    this.logs = new LogManager(this);
    this.maps = new MapManager(this);
    this.players = new PlayerManager(this);
    this.server = new ServerManager(this);
    this.session = new SessionManager(this);
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
   * Forcibly disconnects the client and shuts down all active network connections.
   */
  disconnect() {
    if (this.pool) {
      this.pool.disconnect();
    }
  }

  /**
   * Sends an RCON message.
   *
   * @param {Object} options - The message options.
   * @param {string} options.name - Name of the command.
   * @param {Object} [options.contentBody] - The main content of the message.
   * @returns {Promise<ResponseMessage>}
   */
  async send(options) {
    return this.pool.send({ name: options.name, contentBody: options.contentBody });
  }

  /**
   * Retrieves list of RCON commands.
   *
   * @returns {Promise<Object|string>}
   */
  async fetchRCONCommands() {
    const response = await this.send({
      name: "GetDisplayableCommands"
    });

    // Just use players _validateResponse, client shouldnt extend BaseManager.
    this.players._validateResponse(response);

    return response.contentBody.entries.map(c => ({
      id: c.iD, friendlyName: c.friendlyName, isClientSupported: c.isClientSupported
    }));
  }

  /**
   * Gets information about a particular RCON command.
   *
   * @returns {Promise<RCONCommandInformation>}
   */
  async fetchCommandInformation(commandName) {
    this.players._validateParameter(commandName, "commandName");

    const response = await this.send({
      name: "GetClientReferenceData",
      contentBody: commandName
    });

    this.players._validateResponse(response);

    const formatted = response.contentBody;

    // Iterate through parameters to replace iD with id
    if (formatted && Array.isArray(formatted.dialogueParameters)) {
      formatted.dialogueParameters.forEach(param => {
        if (param.iD !== undefined) {
          param.id = param.iD;
          delete param.iD;
        }
      });
    }

    return formatted;
  }
}

module.exports = RCONClient;