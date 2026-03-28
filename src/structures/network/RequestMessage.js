/**
 * Represents a message to be sent to the server.
 */
class RequestMessage {
  id;

  client;
  version = 2;
  name;
  contentBody;

  /**
   * @param connection {RCONConnection}
   * @param {Object} options
   * @param {string} options.name The RCON command name.
   * @param {string} [options.contentBody] The RCON command body if applicable.
   */
  constructor(connection, options) {
    this.RCONConnection = connection;
    this.name = options.name;
    this.contentBody = options.contentBody || "";

    // Increment transmit ID and assign it ot this request.
    this.id = this.RCONConnection.transmitMessageIndex = this.RCONConnection.transmitMessageIndex + 1;
  }

  /**
   * Wraps this RequestMessage in an unencrypted buffer to be directly sent through the socket.
   *
   * * @returns {Buffer<ArrayBuffer>}
   */
  toUnencryptedBuffer() {
    const body = {
      AuthToken: this.RCONConnection.authToken || "",
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
   *
   * @returns {Buffer<ArrayBuffer>}
   */
  toBuffer() {
    const unencryptedBuffer = this.toUnencryptedBuffer();
    const encryptedBuffer = Buffer.alloc(unencryptedBuffer.length);
    const xorKey = this.RCONConnection.xorKey;

    // Ensure the key exists to prevent division by zero or undefined errors
    if (!xorKey || xorKey.length === 0) {
      throw new Error("XOR key is missing or empty on the client.");
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