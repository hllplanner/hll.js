const BaseManager = require("../managers/BaseManager");

/**
 * @typedef {Object} ServerConfiguration
 * @property {string} serverName
 * @property {string} buildNumber
 * @property {string} buildRevision
 * @property {Array<string>} supportedPlatforms
 * @property {boolean} passwordProtected
 */

/**
 * Manages server configurations and actions.
 * @extends BaseManager
 */
class ServerManager extends BaseManager {
  /** @type {RCONClient} */
  client;

  constructor(client) {
    super();

    this.client = client;
  }

  /**
   * Adds a word to the banned words list.
   *
   * @param {Array<string>} words
   * @returns {Promise<void>}
   */
  async addBannedWords(words) {
    for (const word of words) {
      this._validateParameter(word, "word");
    }

    const response = await this.client.send({
      name: "AddBannedWords",
      contentBody: {
        BannedWords: words.join(",")
      }
    });

    this._validateResponse(response);
  }

  /**
   * Fetches the auto balance on/off status.
   *
   * @returns {Promise<boolean>}
   */
  async fetchAutoBalanceEnabled() {
    const response = await this.client.send({
      name: "GetAutoBalanceEnabled"
    });

    this._validateResponse(response);

    return response.contentBody.enable;
  }

  /**
   * Fetches the auto balance threshold.
   *
   * @returns {Promise<number>}
   */
  async fetchAutoBalanceThreshold() {
    const response = await this.client.send({
      name: "GetAutoBalanceThreshold"
    });

    this._validateResponse(response);

    return response.contentBody.autoBalanceThreshold;
  }

  /**
   * Fetches all banned words.
   *
   * @returns {Promise<Array<string>>}
   */
  async fetchBannedWordsList() {
    const response = await this.client.send({
      name: "GetServerInformation",
      contentBody: {
        Name: "bannedwords"
      }
    });

    this._validateResponse(response);

    return response.contentBody.bannedWords;
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
   * Fetches the high ping threshold in milliseconds.
   *
   * @returns {Promise<number>}
   */
  async fetchHighPingThreshold() {
    const response = await this.client.send({
      name: "GetHighPingThreshold"
    });

    this._validateResponse(response);

    return response.contentBody.highPingThresholdMs;
  }

  /**
   * Fetches the idle kick duration in minutes.
   *
   * @returns {Promise<number>}
   */
  async fetchIdleKickDuration() {
    const response = await this.client.send({
      name: "GetKickIdleDuration"
    });

    this._validateResponse(response);

    return response.contentBody.idleTimeoutMinutes;
  }

  /**
   * Fetches the team switch cooldown in minutes.
   *
   * @returns {Promise<number>}
   */
  async fetchTeamSwitchCooldown() {
    const response = await this.client.send({
      name: "GetTeamSwitchCooldown"
    });

    this._validateResponse(response);

    return response.contentBody.teamSwitchTimer;
  }

  /**
   * Fetches if vote kick is enabled.
   *
   * @returns {Promise<boolean>}
   */
  async fetchVoteKickEnabled() {
    const response = await this.client.send({
      name: "GetVoteKickEnabled"
    });

    this._validateResponse(response);

    return response.contentBody.enable;
  }

  /**
   * Fetches the vote kick thresholds.
   *
   * @returns {Promise<void>}
   */
  async fetchVoteKickThresholds() {
    const response = await this.client.send({
      name: "GetVoteKickThreshold"
    });

    this._validateResponse(response);

    return response.contentBody.voteThresholdList;
  }

  /**
   * Removes banned words from the server ban list.
   *
   * @param {Array<string>} words
   * @returns {Promise<void>}
   */
  async removeBannedWords(words) {
    for (const word of words) {
      this._validateParameter(word, "word");
    }

    const response = await this.client.send({
      name: "RemovebannedWords",
      contentBody: {
        BannedWords: words.join(",")
      }
    });

    this._validateResponse(response);
  }

  /**
   * Removes a custom timer for a gamemode.
   *
   * @param {"Warfare"|"Offensive"|"Skirmish"} gamemode
   * @returns {Promise<void>}
   */
  async removeMatchTimer(gamemode) {
    this._validateParameter(gamemode, "gamemode");

    if (!["Warfare", "Offensive", "Skirmish"].includes(gamemode)) {
      throw new Error(`Validation Error: ${gamemode} is not a valid gamemode.`);
    }

    const response = await this.client.send({
      name: "RemoveMatchTimer",
      contentBody: {
        GameMode: gamemode
      }
    });

    this._validateResponse(response);
  }

  /**
   * Removes a custom warmup timer for a gamemode.
   *
   * @param {"Warfare"|"Offensive"|"Skirmish"} gamemode
   * @returns {Promise<void>}
   */
  async removeWarmupTimer(gamemode) {
    this._validateParameter(gamemode, "gamemode");

    if (!["Warfare", "Offensive", "Skirmish"].includes(gamemode)) {
      throw new Error(`Validation Error: ${gamemode} is not a valid gamemode.`);
    }

    const response = await this.client.send({
      name: "RemoveWarmupTimer",
      contentBody: {
        GameMode: gamemode
      }
    });

    this._validateResponse(response);
  }

  /**
   * Resets vote kick thresholds to an empty list.
   *
   * @returns {Promise<void>}
   */
  async resetVoteKickThresholds() {
    const response = await this.client.send({
      name: "ResetVoteKickThreshold"
    });

    this._validateResponse(response);
  }

  /**
   * Enables/Disables auto balance.
   *
   * @param {boolean} enable
   * @returns {Promise<void>}
   */
  async setAutoBalanceEnabled(enable) {
    this._validateParameter(enable, "enable", {
      nonEmptyString: false,
      boolean: true
    });

    const response = await this.client.send({
      name: "SetAutoBalanceEnabled",
      contentBody: {
        Enable: enable
      }
    });

    this._validateResponse(response);
  }

  /**
   * Set the threshold for auto balance to take effect.
   *
   * @param {number} threshold - Player difference
   * @returns {Promise<void>}
   */
  async setAutoBalanceThreshold(threshold) {
    this._validateParameter(threshold, "threshold", {
      nonEmptyString: false,
      integer: true
    });

    const response = await this.client.send({
      name: "SetAutoBalanceThreshold",
      contentBody: {
        AutoBalanceThreshold: threshold
      }
    });

    this._validateResponse(response);
  }

  /**
   * Sets high ping threshold.
   *
   * @param {number} threshold - Threshold in milliseconds
   * @returns {Promise<void>}
   */
  async setHighPingThreshold(threshold) {
    this._validateParameter(threshold, "threshold", {
      integer: true
    });

    const response = await this.client.send({
      name: "SetHighPingThreshold",
      contentBody: {
        HighPingThresholdMs: threshold
      }
    });

    this._validateResponse(response);
  }

  /**
   * Sets the idle kick duration.
   *
   * @param {number} duration - The duration in minutes.
   * @returns {Promise<void>}
   */
  async setIdleKickDuration(duration) {
    this._validateParameter(duration, "duration", {
      nonEmptyString: false,
      integer: true
    });

    const response = await this.client.send({
      name: "SetIdleKickDuration",
      contentBody: {
        IdleTimeoutMinutes: duration
      }
    });

    this._validateResponse(response);
  }

  /**
   * Set the match timer for gamemodes.
   *
   * @param {"Warfare"|"Offensive"|"Skirmish"} gamemode
   * @param {number} duration - Duration in minutes
   * @returns {Promise<void>}
   */
  async setMatchTimer(gamemode, duration) {
    this._validateParameter(gamemode, "gamemode");
    this._validateParameter(duration, "duration", {
      nonEmptyString: false,
      positiveInteger: true
    });

    switch (gamemode) {
      case "Warfare": {
        if (duration < 30 || duration > 180) {
          throw new Error(`Validation error: ${gamemode} duration must be between 30 and 180 minutes. Got ${duration}`);
        }

        break;
      }

      // Both skirmish and offensive may be between 10 and 60 minutes.
      case "Skirmish":
      case "Offensive": {
        if (duration < 30 || duration > 180) {
          throw new Error(`Validation error: ${gamemode} duration must be between 10 and 60 minutes. Got ${duration}`);
        }

        break;
      }

      default:
        throw new Error(`Validation error, ${gamemode} is not a valid gamemode.`);
    }

    const response = await this.client.send({
      name: "SetMatchTimer",
      contentBody: {
        GameMode: gamemode,
        MatchLength: duration
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

  /**
   * Set the team switch cooldown.
   *
   * @param {number} cooldown - Cooldown in minutes.
   * @returns {Promise<void>}
   */
  async setTeamSwitchCooldown(cooldown) {
    this._validateParameter(cooldown, "cooldown", {
      nonEmptyString: false,
      integer: true
    });

    const response = await this.client.send({
      name: "SetTeamSwitchCooldown",
      contentBody: {
        TeamSwitchTimer: cooldown
      }
    });

    this._validateResponse(response);
  }

  /**
   * Sets the VIP slot count.
   *
   * @param {number} count
   * @returns {Promise<void>}
   */
  async setVipSlotCount(count) {
    this._validateParameter(count, "count", {
      nonEmptyString: false,
      integer: true
    });

    const response = await this.client.send({
      name: "SetVipSlotCount",
      contentBody: {
        VipSlotCount: count
      }
    });

    this._validateResponse(response);
  }

  /**
   * Enables/disables vote kick.
   *
   * @param {boolean} enable
   * @returns {Promise<void>}
   */
  async setVoteKickEnabled(enable) {
    this._validateParameter(enable, "enable", {
      nonEmptyString: false,
      boolean: true
    });

    const response = await this.client.send({
      name: "SetVoteKickEnabled",
      contentBody: {
        Enable: enable
      }
    });

    this._validateResponse(response);
  }

  /**
   * Sets the vote kick thresholds.
   *
   * @param {Array<{playerCount: number, voteThreshold: number}>} thresholds - Array of threshold objects.
   * @returns {Promise<void>}
   */
  async setVoteKickThresholds(thresholds) {
    // Sort ascending
    thresholds = thresholds.sort((a, b) => a.playerCount - b.playerCount);

    if (thresholds[0].playerCount !== 0) {
      throw new Error(`Validation Error: Must have a threshold for 0 players.`);
    }

    for (const { playerCount, voteThreshold } of thresholds) {
      if (playerCount !== 0 && voteThreshold >= playerCount) {
        throw new Error(`Validation Error: Votes needed (${voteThreshold}) must be less than player count (${playerCount}).`);
      }
    }

    const response = await this.client.send({
      name: "SetVoteKickThreshold",
      contentBody: {
        ThresholdValue: thresholds.flatMap(t => [t.playerCount, t.voteThreshold]).join(",")
      }
    });

    this._validateResponse(response);
  }

  /**
   * Set the match timer for gamemodes.
   *
   * @param {"Warfare"|"Offensive"|"Skirmish"} gamemode
   * @param {number} length - Length in minutes between 1 and 10
   * @returns {Promise<void>}
   */
  async setWarmupTimer(gamemode, length) {
    this._validateParameter(gamemode, "gamemode");
    this._validateParameter(length, "length", {
      nonEmptyString: false,
      positiveInteger: true
    });

    if (!["Warfare", "Offensive", "Skirmish"].includes(gamemode)) {
      throw new Error(`Validation Error: ${gamemode} is not a valid gamemode.`);
    }

    if (length < 1 || length > 10) {
      throw new Error(`Validation Error: Length must be between 1 and 10, got ${length}`);
    }

    const response = await this.client.send({
      name: "SetWarmupTimer",
      contentBody: {
        GameMode: gamemode,
        WarmupLength: length
      }
    });

    this._validateResponse(response);
  }

  /**
   * Sets the welcome message for the server.
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
}

module.exports = ServerManager;