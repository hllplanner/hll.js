const BaseManager = require("./BaseManager.js");

/**
 * @typedef {Object} Session
 * @property {string} serverName
 * @property {string} mapName
 * @property {string} mapId
 * @property {string} gameMode
 * @property {number} remainingMatchTime
 * @property {number} matchTime
 * @property {number} alliedFaction
 * @property {number} axisFaction
 * @property {number} alliedScore
 * @property {number} axisScore
 * @property {number} playerCount
 * @property {number} alliedPlayerCount
 * @property {number} axisPlayerCount
 * @property {number} maxPlayerCount
 * @property {number} queueCount
 * @property {number} maxQueueCount
 * @property {number} vipQueueCount
 * @property {number} maxVipQueueCount
 * */

/**
 * Handles all functions for the active game session.
 */
class SessionManager extends BaseManager {
  /** @type {RCONClient} */
  client;

  constructor(client) {
    super();

    this.client = client;
  }

  /**
   * Broadcasts a message to all players.
   *
   * @param {string} message
   * @returns {Promise<void>}
   */
  async broadcast(message) {
    this._validateResponse(message, "message");

    const response = await this.client.send({
      name: "ServerBroadcast",
      contentBody: {
        Message: message
      }
    });

    this._validateResponse(response);
  }

  /**
   * Fetches the current session state.
   *
   * @returns {Promise<Session>}
   */
  async fetch() {
    const response = await this.client.send({
      name: "GetServerInformation",
      contentBody: {
        Name: "session"
      }
    });

    this._validateResponse(response);

    return response.contentBody;
  }

  /**
   * Sets the map for the session.
   *
   * @param {string} mapId
   * @returns {Promise<void>}
   */
  async setMap(mapId) {
    this._validateParameter(mapId, "mapId");

    const response = await this.client.send({
      name: "ChangeMap",
      contentBody: {
        MapName: mapId
      }
    });

    this._validateResponse(response);
  }

  /**
   * Sets the sector layout.
   *
   * @param {Array<string>} sectors - The name sof the capture points. From left to right for horizontal maps and top to bottom for vertical maps.
   * @returns {Promise<void>}
   */
  async setSectorLayout(sectors) {
    const response = await this.client.send({
      name: "SetSectorLayout",
      contentBody: {
        Sector_1: sectors[0],
        Sector_2: sectors[1],
        Sector_3: sectors[2],
        Sector_4: sectors[3],
        Sector_5: sectors[4]
      }
    });

    this._validateResponse(response);
  }
}

module.exports = SessionManager;