const BaseManager = require("./BaseManager");
const Player = require("../models/Player");

/**
 * @typedef {Object} VIPPlayer
 * @property {string} id
 * @property {string} comment
 */

/**
 * @typedef {Object} BanRecord
 * @property {string} userId
 * @property {string} userName
 * @property {string} timeOfBanning
 * @property {number} durationHours
 * @property {string} banReason
 * @property {string} adminName
 */

/**
 * Handles storage and manipulation of player data.
 *
 * @class
 * @extends {BaseManager}
 */
class PlayerManager extends BaseManager {
  /** @type {RCONClient} */
  client;

  /** @type {Map<string, Player>} */
  cache;

  /**
   * @param {RCONClient} client
   */
  constructor(client) {
    super();

    this.client = client;
    this.cache = new Map();
  }

  /**
   * Resolves a player data payload into a cached Player object and returns the Player instance.
   *
   * @param {Object} data
   * @param {boolean} [isPartial=false]
   * @returns {Player}
   */
  _cache(data, isPartial = false) {
    let cachedPlayer = this.cache.get(data.iD);

    if (cachedPlayer) {
      cachedPlayer._patch(data);
    } else {
      cachedPlayer = new Player(this.client, data, isPartial);
      this.cache.set(cachedPlayer.iD, cachedPlayer);
    }

    return cachedPlayer;
  }

  /**
   * Grants player VIP status.
   *
   * @param {string} playerId - The player's ID.
   * @param {string} [comment] - A comment to identify this player in the VIP list.
   * @returns {Promise<void>}
   */
  async addVIP(playerId, comment) {
    this._validateParameter(playerId, "playerId");

    const response = await this.client.send({
      name: "AddVIP",
      contentBody: {
        PlayerId: playerId,
        Comment: comment
      }
    });

    this._validateResponse(response);
  }

  /**
   * Disbands a platoon.
   *
   * @param {string|number} team - The number of name of the team, ex: 0, or "AXIS"
   * @param {string|number} platoon - The name of the platoon, ex: 0 or "ABLE"
   * @param {string} [reason]
   * @returns {Promise<void>}
   * @throws {Error} - If team or platoon is undefined.
   */
  async disbandPlatoon(team, platoon, reason) {
    // They can be strings or ints, so just make sure they exist.
    this._validateParameter(team, "team", {
      nonEmptyString: false
    });
    this._validateParameter(platoon, "platoon", {
      nonEmptyString: false
    });

    const response = await this.client.send({
      name: "DisbandPlatoon",
      contentBody: {
        TeamIndex: team,
        SquadIndex: platoon,
        Reason: reason
      }
    });

    this._validateResponse(response);
  }

  /**
   * Fetches information for a player.
   *
   * @param {string} playerId - The player's ID.
   * @returns {Promise<Player>}
   * @throws {Error} If the player is not found.
   */
  async fetch(playerId) {
    this._validateParameter(playerId, "query");

    const response = await this.client.send({
      name: "GetServerInformation",
      contentBody: {
        Name: "player",
        Value: playerId
      }
    });

    const body = this._validateResponse(response, {
      500: "Player not found."
    });

    return this._cache(body);
  }

  /**
   * Fetches all players actively in the server.
   *
   * @returns {Promise<Array<Player>>}
   */
  async fetchAllPlayers() {
    const response = await this.client.send({
      name: "GetServerInformation",
      contentBody: {
        Name: "players"
      }
    });

    const body = this._validateResponse(response);

    return body.players.map(p => this._cache(p));
  }

  /**
   * Kicks a player from the server.
   *
   * @param {string} playerId - The player ID or username.
   * @param {string} [reason] - Reason to kick the player for.
   * @throws {Error} - If player is undefined.
   * @returns {Promise<void>}
   */
  async kick(playerId, reason) {
    this._validateParameter(playerId, "playerId");

    const response = await this.client.send({
      name: "KickPlayer",
      contentBody: {
        PlayerId: playerId,
        Reason: reason
      }
    });

    this._validateResponse(response);
  }

  /**
   * Lists permanent bans on record.
   *
   * @returns {Promise<Array<BanRecord>>}
   */
  async listPermaBans() {
    const response = await this.client.send({
      name: "GetPermanentBans"
    });

    this._validateResponse(response);

    return response.contentBody.banList;
  }

  /**
   * Lists temporary bans on record.
   *
   * @returns {Promise<Array<BanRecord>>}
   */
  async listTempBans() {
    const response = await this.client.send({
      name: "GetTemporaryBans"
    });

    this._validateResponse(response);

    return response.contentBody.banList;
  }

  /**
   * Retrieves the list of VIP players for this server.
   *
   * @returns {Promise<Array<VIPPlayer>>}
   */
  async listVIPPlayers() {
    const response = await this.client.send({
      name: "GetServerInformation",
      contentBody: {
        Name: "Vipplayers"
      }
    });

    this._validateResponse(response);

    return response.contentBody.vipPlayers.map(p => ({ id: p.iD, comment: p.comment }));
  }

  /**
   * Sends a message to a player.
   *
   * @param {string} playerId - The player ID or username.
   * @param {string} message - The message to send.
   * @throws {Error} - If player or message is undefined.
   * @returns {Promise<void>}
   */
  async message(playerId, message) {
    this._validateParameter(playerId, "playerId");
    this._validateParameter(message, "message");

    const response = await this.client.send({
      name: "MessagePlayer",
      contentBody: {
        PlayerId: playerId,
        Message: message
      }
    });

    this._validateResponse(response);
  }

  /**
   * Permanently ban a player.
   *
   * @param {string} playerId
   * @param {string} [reason]
   * @param {string} [adminName]
   * @returns {Promise<void>}
   * @throws {Error} - If playerId is undefined.
   */
  async permaBan(playerId, reason, adminName) {
    this._validateParameter(playerId, "playerId");

    const response = await this.client.send({
      name: "PermanentBanPlayer",
      contentBody: {
        PlayerId: playerId,
        Reason: reason,
        AdminName: adminName
      }
    });

    this._validateResponse(response);
  }

  /**
   * Punishes a player.
   *
   * @param {string} playerId
   * @param {string} [reason]
   * @returns {Promise<void>}
   * @throws {Error} - If playerId is undefined.
   */
  async punish(playerId, reason) {
    this._validateParameter(playerId, "playerId");

    const response = await this.client.send({
      name: "PunishPlayer",
      contentBody: {
        PlayerId: playerId,
        Reason: reason
      }
    });

    this._validateResponse(response);
  }

  /**
   * Removes a player's permanent ban.
   *
   * @param {string} playerId
   * @returns {Promise<void>}
   * @throws {Error} - If playerId is undefined.
   */
  async removePermaBan(playerId) {
    this._validateParameter(playerId, "playerId");

    const response = await this.client.send({
      name: "RemovePermanentBan",
      contentBody: {
        PlayerId: playerId
      }
    });

    this._validateResponse(response);
  }

  /**
   * Removes a player from their platoon.
   *
   * @param {string} playerId
   * @param {string} [reason]
   * @returns {Promise<void>}
   * @throws {Error} - If player is commander or isn't in a platoon.
   */
  async removePlayerFromPlatoon(playerId, reason) {
    this._validateParameter(playerId, "playerId");

    const response = await this.client.send({
      name: "RemovePlayerFromPlatoon",
      contentBody: {
        PlayerId: playerId,
        Reason: reason,
      }
    });

    this._validateResponse(response);
  }

  /**
   * Removes a player's VIP status.
   *
   * @param {string} playerId
   * @returns {Promise<void>}
   * @throws {Error} - If playerId is undefined.
   */
  async removeVIP(playerId) {
    this._validateParameter(playerId, "playerId");

    const response = await this.client.send({
      name: "RemoveVIP",
      contentBody: {
        PlayerId: playerId
      }
    });

    this._validateResponse(response);
  }

  /**
   * Removes a temporary ban.
   *
   * @param {string} playerId
   * @returns {Promise<void>}
   * @throws {Error} - If playerId is undefined.
   */
  async removeTempBan(playerId) {
    this._validateParameter(playerId, "playerId");

    const response = await this.client.send({
      name: "RemoveTemporaryBan",
      contentBody: {
        PlayerId: playerId
      }
    });

    this._validateResponse(response);
  }

  /**
   * Switches a player's team.
   *
   * @param {string} playerId
   * @param {boolean=true} [switchNow] - Whether to switch this player's team immediately, as opposed to on death.
   * @returns {Promise<void>}
   */
  async switchTeams(playerId, switchNow = true) {
    this._validateParameter(playerId, "playerId");
    this._validateParameter(switchNow, "switchNow", {
      nonEmptyString: false,
      boolean: true
    });

    const response = await this.client.send({
      name: "ForceTeamSwitch",
      contentBody: {
        PlayerId: playerId,
        ForceMode: Number(switchNow)
      }
    });

    this._validateResponse(response);
  }

  /**
   * Temporarily ban a player from the server.
   *
   * @param {string} playerId
   * @param {number} duration - The ban duration in hours.
   * @param {string} [reason]
   * @param {string} [adminName]
   * @returns {Promise<void>}
   * @throws {Error} - If playerId is undefined.
   * @throws {Error} - If duration isn't a positive integer.
   */
  async tempBan(playerId, duration, reason, adminName) {
    this._validateParameter(playerId, "playerId");
    // Technically duration can be sent undefined, but the ban will be for an absurdly large random number of hours, then the user can not be unbanned until their temporary ban duration is explicitly redeclared.
    this._validateParameter(duration, "duration", {
      nonEmptyString: false,
      positiveInteger: true
    });

    const response = await this.client.send({
      name: "TemporaryBanPlayer",
      contentBody: {
        PlayerId: playerId,
        Duration: duration,
        Reason: reason,
        AdminName: adminName
      }
    });

    this._validateResponse(response);
  }
}

module.exports = PlayerManager;