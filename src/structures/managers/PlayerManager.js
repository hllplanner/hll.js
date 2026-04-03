const BaseManager = require("./BaseManager");
const Player = require("../models/Player");
const assert = require("node:assert");

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
   * Fetches information for a player.
   *
   * @param {string} playerId - The player's ID.
   * @returns {Player}
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
   * Kicks a player from the server.
   *
   * @param {string} player - The player ID or username.
   * @param {string} [reason] - Reason to kick the player for.
   * @throws {Error} - On server error.
   * @throws {Error} - If player is undefined.
   * @returns {Promise<void>}
   */
  async kick(player, reason) {
    this._validateParameter(player, "player");

    const response = await this.client.send({
      name: "KickPlayer",
      contentBody: {
        PlayerId: player,
        Reason: reason
      }
    });

    this._validateResponse(response);
  }
}

module.exports = PlayerManager;