const BaseManager = require("./BaseManager");

/**
 * Handles log fetching, parsing, and storage.
 */
class LogManager extends BaseManager {
  /** @type {RCONClient} */
  client;

  constructor(client) {
    super();
    this.client = client;
  }

  /**
   * Fetches recent logs.
   *
   * @param {number} backtrack - Backtrack in seconds.
   * @param {string} [filter] - Optional string filter.
   * @returns {Promise<void>}
   */
  async fetch(backtrack, filter) {
    this._validateParameter(backtrack, "backtrack", {
      nonEmptyString: false,
      positiveInteger: true
    });

    const response = await this.client.send({
      name: "GetAdminLog",
      contentBody: {
        LogBackTrackTime: backtrack,
        Filters: filter
      }
    });

    this._validateResponse(response);

    return response.contentBody.entries;
  }
}

module.exports = LogManager;