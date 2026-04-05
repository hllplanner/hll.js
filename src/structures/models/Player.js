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
   * @param {RCONClient} client
   * @param {Object} data
   * @param {boolean} isPartial
   */
  constructor(client, data, isPartial) {
    // Hide the client reference from console logs
    Object.defineProperty(this, "client", { value: client, enumerable: false });

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

    // Automatically clear the partial flag if core state data is received
    if ("scoreData" in data || "worldPosition" in data) {
      this.partial = false;
    }
  }

  /**
   * Add this user as an admin.
   *
   * @param {string} adminGroup
   * @param {string} [comment]
   * @returns {Promise<void>}
   */
  async addAdmin(adminGroup, comment) {
    return this.client.players.addAdmin(this.id, adminGroup, comment);
  }

  /**
   * Grants this player VIP status.
   *
   * @param {string} comment
   * @returns {Promise<void>}
   */
  async addVIP(comment) {
    return this.client.players.addVIP(this.id, comment);
  }

  /**
   * Kicks this player from the server.
   *
   * @param {string} [reason]
   * @returns {Promise<void>}
   */
  async kick(reason) {
    return this.client.players.kick(this.id, reason);
  }

  /**
   * Sends this player a message.
   *
   * @param {string} message
   * @returns {Promise<void>}
   */
  async message(message) {
    return this.client.players.message(this.id, message);
  }

  /**
   * Permanently ban this player.
   *
   * @param {string} [reason]
   * @param {string} [adminName]
   * @returns {Promise<void>}
   */
  async permaBan(reason, adminName) {
    return this.client.players.permaBan(this.id, reason, adminName);
  }

  /**
   * Punishes this player.
   *
   * @param {string} [reason]
   * @returns {Promise<void>}
   */
  async punish(reason) {
    return this.client.players.punish(this.id, reason);
  }

  /**
   * Remove this user as an admin.
   * @returns {Promise<void>}
   */
  async removeAdmin() {
    return this.client.players.removeAdmin(this.id);
  }

  /**
   * Removes this player from their platoon.
   *
   * @param {string} [reason]
   * @returns {Promise<void>}
   * @throws {Error} - If the player is commander or not in a unit.
   */
  async removeFromPlatoon(reason) {
    return this.client.players.removePlayerFromPlatoon(this.id, reason);
  }

  /**
   * Remove this player's permanent ban.
   *
   * @returns {Promise<void>}
   */
  async removePermaBan() {
    return this.client.players.removePermaBan(this.id);
  }

  /**
   * Removes this player's temporary ban.
   *
   * @returns {Promise<void>}
   */
  async removeTempBan() {
    return this.client.players.removeTempBan(this.id);
  }

  /**
   * Removes this player's VIP status.
   *
   * @returns {Promise<void>}
   */
  async removeVIP() {
    return this.client.players.removeVIP(this.id);
  }

  /**
   * Temporarily bans this player.
   *
   * @param {number} duration - The number in hours for the temporary ban.
   * @param {string} [reason]
   * @param {string} [adminName]
   * @returns {Promise<void>}
   * @throws {Error} - If duration isn't a positive integer.
   */
  async tempBan(duration, reason, adminName) {
    return this.client.players.tempBan(this.id, duration, reason, adminName);
  }

  /**
   * Switch this player's team.
   *
   * @param {boolean} [switchNow=true] - Whether to switch this player's team immediately, as opposed to on death.
   * @returns {Promise<void>}
   */
  async switchTeams(switchNow) {
    return this.client.players.switchTeams(this.id, switchNow);
  }
}

module.exports = Player;