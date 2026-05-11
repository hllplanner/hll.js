const net = require("node:net");
const { EventEmitter } = require("node:events");
const ResponseMessage = require("./ResponseMessage");
const RequestMessage = require("./RequestMessage");

/**
 * @typedef {Object} RequestCacheItem
 * @property {Function} resolve - The promise resolve function.
 * @property {Function} reject - The promise reject function.
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

  /** @type {number} */
  transmitMessageIndex = 0;

  /** @type {Buffer} */
  receiveBuffer = Buffer.alloc(0);

  /** @type {Record<number, RequestCacheItem>} */
  requestCache = {};

  /** @type {number} */
  messagesInAir = 0;

  /** @type {number} */
  maxMessagesInAir = 15;

  /** @type {string} */
  host;

  /** @type {number} */
  port;

  /** @type {string} */
  password;

  /** @type {number} */
  consecutiveTimeouts = 0;

  /** @type {number} */
  maxConsecutiveTimeouts = 3;

  /**
   * @param {Object} options - The initialization options.
   * @param {RCONClient} options.client - The parent RCON client instance.
   */
  constructor({ client }) {
    super();

    this.host = client.host;
    this.port = client.port;
    this.password = client.password;

    this.socket.setKeepAlive(true, 10000);

    this.socket.on("ready", async () => {
      const serverConnectResponse = await this.send(
        { name: "ServerConnect" },
        { encrypt: false }
      );

      const { statusCode, statusMessage } = serverConnectResponse;
      if (statusCode !== 200) {
        throw new Error(`Error running ServerConnect: ${statusMessage}`);
      }
    });

    this.socket.on("data", this.#handlePacket.bind(this));
    this.socket.connect(this.port, this.host);
  }

  /**
   * Closes the socket.
   */
  disconnect() {
    this.socket.destroy();
  }

  /**
   * Constructs and sends a RequestMessage to the RCON server.
   * @param {Object} message - The message payload.
   * @param {string} message.name - The command or action name.
   * @param {Object|string} [message.contentBody] - The body content of the message.
   * @param {Object} [options] - Transmission configuration.
   * @param {boolean} [options.encrypt=true] - Whether to send the buffer encrypted.
   * @param {number} [options.timeout=10000] - Message timeout.
   * @returns {Promise<ResponseMessage>} The resolved response from the server.
   */
  async send(message, options = {}) {
    const encrypt = options.encrypt !== false;
    const timeout = options.timeout || 10000;

    return new Promise((resolve, reject) => {
      this.transmitMessageIndex += 1;
      const currentId = this.transmitMessageIndex;

      const timer = setTimeout(() => {
        if (this.requestCache[currentId]) {
          delete this.requestCache[currentId];

          this.messagesInAir -= 1;
          this.consecutiveTimeouts += 1;

          reject(new Error(`RCON Request Timeout: ${message.name} (ID: ${currentId})`));

          // Socket is unresponsive, close the connection.
          if (this.consecutiveTimeouts >= this.maxConsecutiveTimeouts) {
            console.warn(`[ZOMBIE CONNECTION] ${this.consecutiveTimeouts} timeouts in a row. Forcing socket kill...`);
            this.socket.destroy();
          }
        }
      }, timeout);

      const requestMessage = new RequestMessage(this, {
        id: currentId,
        name: message.name,
        contentBody: message.contentBody
      });

      const messageBuffer = encrypt
        ? requestMessage.toBuffer()
        : requestMessage.toUnencryptedBuffer();

      this.socket.write(messageBuffer);
      this.messagesInAir += 1;

      this.requestCache[currentId] = {
        resolve: (response) => {
          clearTimeout(timer);
          resolve(response);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
        requestMessage,
        encrypted: encrypt
      };
    });
  }

  /**
   * Appends incoming data to the receive buffer and triggers processing.
   * @private
   * @param {Buffer} data - The raw TCP chunk received from the socket.
   */
  #handlePacket(data) {
    this.receiveBuffer = Buffer.concat([this.receiveBuffer, data]);
    this.#processBuffer();
  }

  /**
   * Processes the buffer, extracting messages as soon as their full content length is received.
   * @private
   */
  #processBuffer() {
    while (this.receiveBuffer.length >= 12) {
      const id = this.receiveBuffer.readUInt32LE(4);
      const contentLength = this.receiveBuffer.readUInt32LE(8);
      const totalMessageLength = 12 + contentLength;

      if (this.receiveBuffer.length < totalMessageLength) {
        break;
      }

      const rawBuffer = this.receiveBuffer.subarray(0, totalMessageLength);
      this.receiveBuffer = this.receiveBuffer.subarray(totalMessageLength);

      const cachedRequest = this.requestCache[id];
      const responseMessage = new ResponseMessage(rawBuffer, cachedRequest);

      if (cachedRequest) {
        this.#handleMessageInternal(responseMessage);

        this.messagesInAir -= 1;
        this.consecutiveTimeouts = 0; // Reset killswtich for dead connections

        cachedRequest.resolve(responseMessage);
        delete this.requestCache[id];
      } else {
        console.warn(`Ghost Packet: Server responded to ${id} but the message already timed out.`);
      }
    }
  }

  /**
   * Internal message parser for handling ServerConnect and authentication routines.
   * @private
   * @param {ResponseMessage} responseMessage - The fully parsed incoming response.
   */
  async #handleMessageInternal(responseMessage) {
    switch (responseMessage.name) {
      case "ServerConnect": {
        const xorKeyB64 = responseMessage.contentBody;
        this.xorKey = Buffer.from(xorKeyB64, "base64");

        await this.send({
          name: "Login",
          contentBody: this.password
        });

        break;
      }

      case "Login": {
        const { statusCode, contentBody } = responseMessage;

        if (statusCode !== 200) {
          this.emit("loginError");
          return;
        }

        this.authToken = contentBody;
        this.emit("ready");

        break;
      }
    }
  }

  /**
   * Resolves all pending requests with an error.
   * @param {string} error
   */
  flushPendingRequests(error) {
    const dropError = new Error(error);

    // Reject all active messages in the air
    for (const id in this.requestCache) {
      this.requestCache[id].reject(dropError);
    }

    this.requestCache = {};
    this.messagesInAir = 0;
  }
}

module.exports = RCONConnection;