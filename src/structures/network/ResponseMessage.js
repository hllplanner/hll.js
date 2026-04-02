/**
 * @typedef {Object} RequestCacheItem
 * @property {Function} resolve - The promise resolve function.
 * @property {RequestMessage} requestMessage - The original request message.
 * @property {boolean} encrypted - Whether the request was encrypted.
 */

/**
 * Applies an XOR cipher to a buffer using the provided key.
 * @param {Buffer} buffer - The input buffer.
 * @param {Buffer} xorKey - The XOR key.
 * @returns {Buffer} The transformed buffer.
 */
const xor = (buffer, xorKey) => {
  const resultBuffer = Buffer.alloc(buffer.length);

  for (let i = 0; i < buffer.length; i++) {
    resultBuffer[i] = buffer[i] ^ xorKey[i % xorKey.length];
  }

  return resultBuffer;
};

/**
 * Represents a message sent from the server.
 * @class
 */
class ResponseMessage {
  /** @type {number} */
  id;

  /** @type {number} */
  contentLength;

  /** @type {Buffer} */
  raw;

  /** @type {number} */
  statusCode;

  /** @type {string} */
  statusMessage;

  /** @type {number} */
  version;

  /** @type {string} */
  name;

  /** @type {string} */
  contentBody;

  /**
   * Parses the raw incoming buffer into a structured response.
   * @param {Buffer} raw - The raw TCP buffer.
   * @param {RequestCacheItem} cachedRequest - The stored request data.
   */
  constructor(raw, cachedRequest) {
    this.raw = raw;

    const header = raw.subarray(0, 12);
    const contentBuffer = cachedRequest.encrypted ? xor(raw.subarray(12), cachedRequest.requestMessage.connection.xorKey) : raw.subarray(12);

    this.id = header.readUInt32LE(4);
    this.contentLength = header.readUInt32LE(8);

    const bufferString = contentBuffer.toString("utf-8");
    const content = JSON.parse(bufferString);

    const { statusCode, statusMessage, version, name, contentBody } = content;

    this.statusCode = statusCode;
    this.statusMessage = statusMessage;
    this.version = version;
    this.name = name;

    // Attempt to parse response as json
    try {
      this.contentBody = JSON.parse(contentBody);
    } catch {
      this.contentBody = contentBody;
    }
  }
}

module.exports = ResponseMessage;