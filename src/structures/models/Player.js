/**
 * @typedef {Object} PlayerScoreData
 * @property {number} combat
 * @property {number} offense
 * @property {number} defense
 * @property {number} support
 */

/**
 * @typedef {Object} PlayerStats
 * @property {number} deaths
 * @property {number} infantryKills
 * @property {number} vehicleKills
 * @property {number} teamKills
 * @property {number} vehiclesDestroyed
 */

/**
 * @typedef {Object} PlayerPosition
 * @property {number} x
 * @property {number} y
 * @property {number} z
 */

/**
 * Represents a player.
 */
class Player {
  /** @type {RCONClient} */
  client;

  /** @type {boolean} */
  partial;

  /** @type {string} */
  id;

  /** @type {string} */
  name;

  /** @type {string} */
  clanTag;

  /** @type {string} */
  platform;

  /** @type {string} */
  eosId;

  /** @type {number} */
  level;

  /** @type {number} */
  team;

  /** @type {number} */
  role;

  /** @type {string} */
  platoon;

  /** @type {PlayerScoreData} */
  scoreData;

  /** @type {PlayerStats} */
  stats;

  /** @type {PlayerPosition} */
  worldPosition;

  /**
   * Initializes Player
   *
   * @param {import("../client/RCONClient").RCONClient} client
   * @param {Object} data
   * @param {boolean} isPartial
   */
  constructor(client, data, isPartial) {
    // Hide the client reference from console.logs
    Object.defineProperty(this, 'client', { value: client, enumerable: false });

    this.partial = isPartial;
    this._patch(data);
  }

  /**
   * Patches this player with new data.
   *
   * @param {Object} data
   */
  _patch(data) {
    if ("iD" in data) this.id = data.iD;
    if ("name" in data) this.name = data.name;
    if ("clanTag" in data) this.clanTag = data.clanTag;
    if ("platform" in data) this.platform = data.platform;
    if ("eosId" in data) this.eosId = data.eosId;
    if ("level" in data) this.level = data.level;
    if ("team" in data) this.team = data.team;
    if ("role" in data) this.role = data.role;
    if ("platoon" in data) this.platoon = data.platoon;

    // Normalize the weird casing on cOMBAT while mapping the object
    if ("scoreData" in data && data.scoreData) {
      this.scoreData = {
        combat: data.scoreData.cOMBAT ?? 0,
        offense: data.scoreData.offense ?? 0,
        defense: data.scoreData.defense ?? 0,
        support: data.scoreData.support ?? 0
      };
    }

    if ("stats" in data && data.stats) {
      this.stats = {
        deaths: data.stats.deaths ?? 0,
        infantryKills: data.stats.infantryKills ?? 0,
        vehicleKills: data.stats.vehicleKills ?? 0,
        teamKills: data.stats.teamKills ?? 0,
        vehiclesDestroyed: data.stats.vehiclesDestroyed ?? 0
      };
    }

    if ("worldPosition" in data && data.worldPosition) {
      this.worldPosition = {
        x: data.worldPosition.x ?? 0,
        y: data.worldPosition.y ?? 0,
        z: data.worldPosition.z ?? 0
      };
    }

    // Automatically clear the partial flag if we receive core state data
    if ("team" in data || "role" in data || "worldPosition" in data) {
      this.partial = false;
    }
  }
}

module.exports = Player;