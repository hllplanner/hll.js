const BaseManager = require("./BaseManager.js");

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
 * Handles server map rotations, sequences, and weather configuration.
 */
class MapManager extends BaseManager {
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
   * @param {number} currentIndex
   * @param {number} newIndex
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
   * @param {string} mapId
   * @param {boolean} enable
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
   * Enable/disable map shuffling.
   *
   * @param {boolean} enable
   * @returns {Promise<void>}
   */
  async setSequenceShuffle(enable) {
    this._validateParameter(enable, "enable", {
      nonEmptyString: false,
      boolean: true
    });

    const response = await this.client.send({
      name: "SetMapShuffleEnabled",
      contentBody: {
        Enable: enable
      }
    });

    this._validateResponse(response);
  }
}

module.exports = MapManager;