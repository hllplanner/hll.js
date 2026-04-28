const crypto = require("node:crypto");
const BaseManager = require("./BaseManager");
const parseLogString = require("../utils/parseLogString");
const { safeRcon } = require("../index");

/**
 * Handles log fetching, parsing, and storage.
 */
class LogManager extends BaseManager {
  /** @type {RCONClient} */
  client;

  /** @type {Set<string>} */
  hashCache = new Set();

  /** @type {number} */
  maxCacheSize = 500; // Surely a sufficiently large limit.

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

  /**
   * Requests logs from the server for internal library operations and log polling.
   *
   * @returns {Promise<void>}
   */
  async #poll() {
    try {
      // Ensure client is ready before attempting communication
      if (this.client.connectionStatus !== "ready") return;

      const backtrackSeconds = Math.floor(this.logPollingBacktrack / 1000);
      const logs = await safeRcon(this.fetch(backtrackSeconds), []);
      if (logs.length <= 0) return;

      for (const log of logs) {
        const hash = crypto
          .createHash("md5")
          .update(JSON.stringify(log))
          .digest("hex");

        // Ensure a log hasnt already been processed before using it for operations
        if (this.hashCache.has(hash)) continue;

        this.hashCache.add(hash);
        this.client.emit(log.type, log);
      }

      // If hash cache exceeds max size delete the oldest values.
      while (this.hashCache.size > this.maxCacheSize) {
        const oldest = this.hashCache.values().next().value;
        this.hashCache.delete(oldest);
      }
    } catch (err) {
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