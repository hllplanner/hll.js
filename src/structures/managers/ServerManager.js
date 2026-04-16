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