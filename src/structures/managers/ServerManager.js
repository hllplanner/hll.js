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
}

module.exports = ServerManager;