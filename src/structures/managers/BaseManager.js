/**
 * Base manager for shared functions.
 * @class
 */
class BaseManager {
  /**
   * Validates RCON response by checking status code.
   *
   * @param {ResponseMessage} response
   * @param {Object} additionalErrors
   * @returns {Object}
   * @throws {Error}
   */
  _validateResponse(response, additionalErrors = {}) {
    if (response.statusCode === 200) {
      return response.contentBody;
    }

    if (additionalErrors[response.statusCode] && typeof additionalErrors[response.statusCode] === "string") {
      throw new Error(`${additionalErrors[response.statusCode]}`);
    }

    throw new Error(`RCON Error (${response.statusCode}): ${response.statusMessage}`);
  }

  /**
   * Checks if a parameter satisfies specific conditions.
   *
   * @param {any} value - The actual value of the parameter.
   * @param {string} name - The name of the parameter.
   * @param {Object} [conditions] - Conditions to be met.
   * @param {boolean} [conditions.defined=true] - Parameter must not be null or undefined.
   * @param {boolean} [conditions.nonEmptyString=true] - Parameter must be a non-empty string.
   * @param {boolean} [conditions.positiveInteger=false] - Parameter must be a positive integer.
   * @param {boolean} [conditions.boolean=false] - Parameter must be a boolean.
   */
  _validateParameter(value, name, conditions = {
    defined: true, nonEmptyString: true, positiveInteger: false, boolean: false
  }) {
    if (conditions.defined && (value === null || value === undefined)) {
      throw new Error(`Validation Error: '${name}' is required but was undefined or null.`);
    }

    if (conditions.nonEmptyString && value !== null && value !== undefined) {
      if (typeof value !== "string") {
        throw new Error(`Validation Error: '${name}' must be a string. Received type: ${typeof value}.`);
      }

      if (value.trim().length === 0) {
        throw new Error(`Validation Error: '${name}' cannot be an empty string.`);
      }
    }

    if (conditions.positiveInteger && (!Number.isInteger(value) || value <= 0)) {
      throw new Error(`Validation Error: '${name}' must be a positive integer.`);
    }

    if (conditions.boolean && typeof value !== "boolean") {
      throw new Error(`Validation Error: '${name}' must be a boolean. Received type: ${typeof value}`);
    }
  }
}

module.exports = BaseManager;