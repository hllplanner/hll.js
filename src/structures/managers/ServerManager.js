const BaseManager = require("../managers/BaseManager");

/**
 * @typedef {Object} ServerConfiguration
 * @property {string} serverName
 * @property {string} buildNumber
 * @property {string} buildRevision
 * @property {Array<string>} supportedPlatforms
 * @property {boolean} passwordProtected
 */

class ServerManager extends BaseManager {
  /** @type {RCONClient} */
  client;

  constructor(client) {
    super();

    this.client = client;
  }

  /**
   * Fetches the server changelist number.
   *
   * @returns {Promise<string>}
   */
  async fetchChangelist() {
    const response = await this.client.send({
      name: "GetServerChangelist"
    });

    this._validateResponse(response);

    return response.contentBody.changelist;
  }

  /**
   * Fetches the server configuration.
   *
   * @returns {Promise<ServerConfiguration>}
   */
  async fetchConfig() {
    const response = await this.client.send({
      name: "GetServerInformation",
      contentBody: {
        Name: "serverconfig"
      }
    });

    this._validateResponse(response);

    return response.contentBody;
  }

  /**
   * Set the welcome message for the server.
   *
   * @param {string} [message]
   * @returns {Promise<void>}
   */
  async setWelcomeMessage(message) {
    const response = await this.client.send({
      name: "SetWelcomeMessage",
      contentBody: {
        Message: message
      }
    });

    this._validateResponse(response);
  }

  /**
   * Sets the maximum queue count.
   *
   * @param {number} count - Between 1 and 6
   * @returns {Promise<void>}
   */
  async setMaxQueuedPlayers(count) {
    this._validateParameter(count, "count", {
      nonEmptyString: false,
      positiveInteger: true
    });

    const response = await this.client.send({
      name: "SetMaxQueuedPlayers",
      contentBody: {
        MaxQueuedPlayers: count
      }
    });

    this._validateResponse(response);
  }
}

module.exports = ServerManager;