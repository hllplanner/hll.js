const BaseManager = require("./BaseManager");
const parseLogString = require("../utils/parseLogString");

/**
 * Handles log fetching, parsing, and storage.
 */
class LogManager extends BaseManager {
  /** @type {RCONClient} */
  client;

  /**
   *
   * @param {RCONClient} client
   * @param {object} [options]
   * @param {boolean} [options.enableLogPolling=true] - Enable log polling.
   * @param {number} [options.logPollingInterval=1000] - Interval at which to poll logs, in milliseconds.
   * @param {number} [options.logPollingBacktrack=5000] - How far back in history each log poll should query, in milliseconds.
   */
  constructor(client, options = {}) {
    super();

    const {
      enableLogPolling = true,
      logPollingInterval = 1000,
      logPollingBacktrack = 5000
    } = options;

    this.client = client;
    this.enableLogPolling = enableLogPolling;
    this.logPollingInterval = logPollingInterval;
    this.logPollingBacktrack = logPollingBacktrack;

    if (this.enableLogPolling) {
      this.#poll();
    }
  }

  async #poll() {
    try {
      if (this.client.connectionStatus !== "ready") return;

      const backtrackSeconds = Math.floor(this.logPollingBacktrack / 1000);
      const logs = await this.fetch(backtrackSeconds);

      for (const log of logs) {
        this.client.emit(log.type, log);
      }

    } catch (err) {
      // Prevent the polling from dying entirely on a single network error
      console.error("Log polling error:", err.message);
    } finally {
      // Schedule the next poll only after the current one finishes
      if (this.enableLogPolling) {
        setTimeout(() => this.#poll(), this.logPollingInterval);
      }
    }
  }

  /**
   * Fetches recent logs.
   *
   * @param {number} backtrack - Backtrack in seconds.
   * @param {string} [filter] - Optional string filter.
   * @returns {Promise<Array<object>>}
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

    const entries = response.contentBody.entries;
    const parsedEntries = entries.map(e => parseLogString(e.message));

    this._validateResponse(response);

    return parsedEntries;
  }
}

module.exports = LogManager;