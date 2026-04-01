const net = require("node:net");
const { EventEmitter } = require("node:events");
const ResponseMessage = require("./ResponseMessage");
const RequestMessage = require("./RequestMessage");

/**
 * @typedef {Object} RequestCacheItem
 * @property {Function} resolve - The promise resolve function.
 * @property {RequestMessage} requestMessage - The instantiated request message.
 * @property {boolean} encrypted - Whether the message was sent encrypted.
 */

/**
 * Represents a single RCON server connection.
 * @class
 * @extends EventEmitter
 */
class RCONConnection extends EventEmitter {
  /** @type {net.Socket} */
  socket = new net.Socket();

  /** @type {Buffer|null} */
  xorKey = null;

  /** @type {string|null} */
  authToken = null;

  /** * Auto-increment for every sent message to assign a unique ID for each request.
   * @type {number}
   */
  transmitMessageIndex = 0;

  /** * Continuous buffer to hold incoming TCP data until full messages are formed.
   * @type {Buffer}
   */
  receiveBuffer = Buffer.alloc(0);

  /** * Key-value map of active messages waiting for response.
   * @type {Record<number, RequestCacheItem>}
   */
  requestCache = {};

  /** @type {number} */
  messagesInAir = 0;

  /** @type {string} */
  host;

  /** @type {number} */
  port;

  /** @type {string} */
  password;

  /**
   * Initializes the RCON connection.
   * @param {Object} options - The initialization options.
   * @param {RCONClient} options.client - The parent RCON client instance.
   */
  constructor({ client }) {
    super();

    // Define authentication parameters
    this.host = client.host;
    this.port = client.port;
    this.password = client.password;

    // Handle socket closure
    this.socket.on("close", (error) => {
      if (error) {
        throw new Error("Socket closed due to transmission error.");
      } else {
        throw new Error("Socket closed.");
      }
    });

    // Socket is ready for communication
    this.socket.on("ready", async () => {
      // Send ServerConnect command to initialize V2 connection
      const serverConnectResponse = await this.send(
        { name: "ServerConnect" },
        { encrypt: false }
      );

      // Ensure the ServerConnect was successful
      const { statusCode, statusMessage } = serverConnectResponse;
      if (statusCode !== 200) {
        throw new Error(`Error running ServerConnect: ${statusMessage}`);
      }
    });

    // Bind data listener to private #handlePacket method
    this.socket.on("data", this.#handlePacket.bind(this));

    // Connect to the socket
    this.socket.connect(this.port, this.host);
  }

  /**
   * Constructs and sends a RequestMessage to the RCON server.
   * @param {Object} message - The message payload.
   * @param {string} message.name - The command or action name.
   * @param {string} [message.contentBody] - The body content of the message.
   * @param {Object} [options={ encrypt: true }] - Transmission configuration.
   * @param {boolean} [options.encrypt=true] - Whether to send the buffer encrypted.
   * @returns {Promise<ResponseMessage>} The resolved response from the server.
   */
  async send(message, options = { encrypt: true }) {
    this.transmitMessageIndex += 1;
    const currentId = this.transmitMessageIndex;

    const requestMessage = new RequestMessage(this, {
      id: currentId,
      name: message.name,
      contentBody: message.contentBody
    });

    const messageBuffer = options.encrypt ? requestMessage.toBuffer() : requestMessage.toUnencryptedBuffer();

    this.socket.write(messageBuffer);
    this.messagesInAir += 1;

    return new Promise((resolve) => {
      this.requestCache[this.transmitMessageIndex] = {
        resolve,
        requestMessage,
        encrypted: options.encrypt
      };
    });
  }

  /**
   * Appends incoming data to the receive buffer and triggers processing.
   * @private
   * @param {Buffer} data - The raw TCP chunk received from the socket.
   * @returns {void}
   */
  #handlePacket(data) {
    // Append the new data to the continuous receive buffer
    this.receiveBuffer = Buffer.concat([this.receiveBuffer, data]);

    // Attempt to process messages from the buffer
    this.#processBuffer();
  }

  /**
   * Processes the buffer, extracting messages as soon as their full content length is received.
   * @private
   * @returns {void}
   */
  #processBuffer() {
    // Loop to handle cases where multiple messages arrive in a single packet
    // The header is 12 bytes long. We need at least 12 bytes to read the content length.
    while (this.receiveBuffer.length >= 12) {

      const id = this.receiveBuffer.readUInt32LE(4);
      const contentLength = this.receiveBuffer.readUInt32LE(8);
      const totalMessageLength = 12 + contentLength;

      // Check if the buffer contains the entire message
      // If not, break the loop and wait for the next packet
      if (this.receiveBuffer.length < totalMessageLength) {
        break;
      }

      // Extract the exact bytes for this single message
      const rawBuffer = this.receiveBuffer.subarray(0, totalMessageLength);

      // Advance the receive buffer to remove the processed message
      this.receiveBuffer = this.receiveBuffer.subarray(totalMessageLength);

      // Get cached request and format response
      const cachedRequest = this.requestCache[id];
      const responseMessage = new ResponseMessage(rawBuffer, cachedRequest);

      // Call internal message handler, decrement internal in-air counter
      this.#handleMessageInternal(responseMessage);
      this.messagesInAir -= 1;

      // Resolve cached request and cleanup
      if (cachedRequest) {
        cachedRequest.resolve(responseMessage);
        delete this.requestCache[id];
      }
    }
  }

  /**
   * Internal message parser for handling ServerConnect and authentication routines.
   * @private
   * @param {ResponseMessage} responseMessage - The fully parsed incoming response.
   * @returns {Promise<void>}
   */
  async #handleMessageInternal(responseMessage) {
    switch (responseMessage.name) {

      // Store XOR key and attempt to authenticate with the server
      case "ServerConnect": {
        const xorKeyB64 = responseMessage.contentBody;
        this.xorKey = Buffer.from(xorKeyB64, "base64");

        await this.send({
          name: "Login",
          contentBody: this.password
        });

        break;
      }

      // Store auth token after successful login
      case "Login": {
        const { statusCode, contentBody } = responseMessage;

        // Validate successful authentication
        if (statusCode !== 200) {
          throw new Error("Error authenticating: Invalid RCON password.");
        }

        this.authToken = contentBody;

        this.emit("ready");

        break;
      }
    }
  }
}

module.exports = RCONConnection;