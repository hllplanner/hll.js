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
 * @typedef {Object} MapRotationEntry
 * @property {string} name
 * @property {string} gameMode
 * @property {string} timeOfDay
 * @property {string} id
 * @property {number} position
 */

/**
 * @typedef {Object} MapSequenceEntry
 * @property {string} name
 * @property {string} gameMode
 * @property {string} timeOfDay
 * @property {string} id - File path of the map
 * @property {number} position
 */

/**
 * Handles all functions for the active game.
 */
class SessionManager extends BaseManager {
  /** @type {RCONClient} */
  client;

  constructor(client) {
    super();

    this.client = client;
  }

  /**
   * Adds a map to the rotation at a given index.
   *
   * @param {string} mapId
   * @param {number} [index]
   * @returns {Promise<void>}
   */
  async addMapToRotation(mapId, index) {
    this._validateParameter(mapId, "mapId");

    const response = await this.client.send({
      name: "AddMapToRotation",
      contentBody: {
        MapName: mapId,
        Index: index
      }
    });

    this._validateResponse(response);
  }

  /**
   * Adds a map to the sequence at a given index.
   *
   * @param {string} mapId
   * @param {number} [index]
   * @returns {Promise<void>}
   */
  async addMapToSequence(mapId, index) {
    this._validateParameter(mapId, "mapId");

    const response = await this.client.send({
      name: "AddMapToSequence",
      contentBody: {
        MapName: mapId,
        Index: index
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
        Name: "Session"
      }
    });

    this._validateResponse(response);

    return response.contentBody;
  }

  /**
   * Fetches the maps in rotation.
   *
   * @returns {Promise<Array<MapRotationEntry>>}
   */
  async fetchMapRotation() {
    const response = await this.client.send({
      name: "GetServerInformation",
      contentBody: {
        Name: "maprotation"
      }
    });

    this._validateResponse(response);

    return response.contentBody.mAPS.map(m => ({
      id: m.iD,
      name: m.name,
      gameMode: m.gameMode,
      timeOfDay: m.timeOfDay,
      position: m.position
    }));
  }

  /**
   * Fetches the maps in the sequence.
   *
   * @returns {Promise<Array<MapSequenceEntry>>}
   */
  async fetchMapSequence() {
    const response = await this.client.send({
      name: "GetServerInformation",
      contentBody: {
        Name: "mapsequence"
      }
    });

    this._validateResponse(response);

    return response.contentBody.mAPS.map(m => ({
      id: m.iD,
      name: m.name,
      gameMode: m.gameMode,
      timeOfDay: m.timeOfDay,
      position: m.position
    }));
  }

  /**
   * Moves a map in the sequence to a new index.
   *
   * @param currentIndex
   * @param newIndex
   * @returns {Promise<void>}
   */
  async moveMapInSequence(currentIndex, newIndex) {
    this._validateParameter(currentIndex, "currentIndex", {
      nonEmptyString: false,
      integer: true
    });
    this._validateParameter(newIndex, "newIndex", {
      nonEmptyString: false,
      integer: true
    });

    const response = await this.client.send({
      name: "MoveMapInSequence",
      contentBody: {
        CurrentIndex: currentIndex,
        NewIndex: newIndex
      }
    });

    this._validateResponse(response);
  }

  /**
   * Removes a map from the rotation at a given index.
   *
   * @param {number} index
   * @returns {Promise<void>}
   */
  async removeMapFromRotation(index) {
    this._validateParameter(index, "index", {
      nonEmptyString: false,
      integer: true
    });

    const response = await this.client.send({
      name: "RemoveMapFromRotation",
      contentBody: {
        Index: index
      }
    });

    this._validateResponse(response);
  }

  /**
   * Removes a map from the sequence at a given index.
   *
   * @param {number} index
   * @returns {Promise<void>}
   */
  async removeMapFromSequence(index) {
    this._validateParameter(index, "index", {
      nonEmptyString: false,
      integer: true
    });

    const response = await this.client.send({
      name: "RemoveMapFromSequence",
      contentBody: {
        Index: index
      }
    });

    this._validateResponse(response);
  }

  /**
   * Enables/Disables dynamic weather for a map.
   *
   * @param mapId
   * @param enable
   * @returns {Promise<void>}
   */
  async setDynamicWeather(mapId, enable) {
    this._validateParameter(mapId, "mapId");
    this._validateParameter(enable, "enable", {
      nonEmptyString: false,
      boolean: true
    });

    const response = await this.client.send({
      name: "SetDynamicWeatherEnabled",
      contentBody: {
        MapId: mapId,
        Enable: enable
      }
    });

    this._validateResponse(response);
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
   * @param {Array<string>} sectors - The name sof the hard points. From left to right for horizontal maps and top to bottom for vertical maps.
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