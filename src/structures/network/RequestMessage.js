/**
 * Represents a message to be sent to the server.
 * @class
 */
class RequestMessage {
  /** @type {number} */
  id;

  /** @type {number} */
  version = 2;

  /** @type {string} */
  name;

  /** @type {string} */
  contentBody;

  /** @type {RCONConnection} */
  connection;

  /**
   * @param {RCONConnection} connection - The connection this message belongs to.
   * @param {Object} options - The message configuration.
   * @param {string} options.name - The RCON command name.
   * @param {string} [options.contentBody] - The RCON command body if applicable.
   * @param {number} options.id - Internal request id.
   */
  constructor(connection, options) {
    this.connection = connection;
    this.name = options.name;
    this.id = options.id;

    // ContentBody should be a json string for all commands excluding ServerConnect and Login
    this.contentBody = ["ServerConnect", "Login"].includes(this.name) ? options.contentBody : JSON.stringify(options.contentBody || "{}");
  }

  /**
   * Wraps this RequestMessage in an unencrypted buffer to be directly sent through the socket.
   * @returns {Buffer} The formatted unencrypted buffer.
   */
  toUnencryptedBuffer() {
    const body = {
      AuthToken: this.connection.authToken || "",
      Version: this.version,
      Name: this.name,
      ContentBody: this.contentBody
    };

    const magicNumber = 0xDE450508; // Defined in API docs
    const stringified = JSON.stringify(body);

    // MN MN MN MN ID ID ID ID SL SL SL SL
    const headerBuffer = Buffer.alloc(12);
    headerBuffer.writeUInt32LE(magicNumber, 0);
    headerBuffer.writeUInt32LE(this.id, 4);
    headerBuffer.writeUInt32LE(stringified.length, 8);

    return Buffer.concat([headerBuffer, Buffer.from(stringified)]);
  }

  /**
   * Wraps this RequestMessage in an encrypted buffer to be directly sent through the socket.
   * @returns {Buffer} The encrypted buffer ready for transmission.
   * @throws {Error} Throws if the XOR key is missing.
   */
  toBuffer() {
    const unencryptedBuffer = this.toUnencryptedBuffer();
    const encryptedBuffer = Buffer.alloc(unencryptedBuffer.length);
    const xorKey = this.connection.xorKey;

    // Ensure the key exists to prevent division by zero or undefined errors
    if (!xorKey || xorKey.length === 0) {
      throw new Error("XOR key is missing or empty.");
    }

    // Copy header over, unencrypted
    for (let i = 0; i < 12; i++) {
      encryptedBuffer[i] = unencryptedBuffer[i];
    }

    // Apply the XOR cipher to the content only
    for (let i = 12; i < unencryptedBuffer.length; i++) {
      encryptedBuffer[i] = unencryptedBuffer[i] ^ xorKey[(i - 12) % xorKey.length];
    }

    return encryptedBuffer;
  }
}

module.exports = RequestMessage;