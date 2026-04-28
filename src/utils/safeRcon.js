/**
 * Safely resolves an RCON promise without throwing.
 *
 * @template T
 * @param {PromiseLike<T>} promise
 * @param {T|null} [fallback=null]
 * @returns {Promise<T|null>}
 */
const safeRcon = async (promise, fallback = null) => {
  try {
    return await promise;
  } catch (err) {
    return fallback;
  }
};

module.exports = safeRcon;