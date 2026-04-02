/**
 * Base manager for shared functions.
 * @class
 */
class BaseManager {
  /**
   * Validates RCON response by checking status code.
   *
   * @param {ResponseMessage} response
   * @returns {Object}
   */
  _validateResponse(response) {
    if (response.statusCode === 200) {
      return response.contentBody;
    }

    throw new Error(`RCON Error (${response.statusCode}): ${response.statusMessage}`);
  }
}

module.exports = BaseManager;