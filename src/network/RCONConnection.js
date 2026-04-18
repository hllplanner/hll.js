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

  /** * Queue of pending send operations waiting for capacity.
   * @type {Array<Function>}
   */
  messageQueue = [];

  /** @type {number} */
  messagesInAir = 0;

  /** * Maximum allowed concurrent requests to prevent server throttling.
   * @type {number}
   */
  maxMessagesInAir = 100;

  /** @type {string} */
  host;

  /** @type {number} */
  port;

  /** @type {string} */
  password;

  /**
   * @param {Object} options - The initialization options.
   * @param {RCONClient} options.client - The parent RCON client instance.
   */
  constructor({ client }) {
    super();

    this.host = client.host;
    this.port = client.port;
    this.password = client.password;

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
   * Enqueues the request if the maximum concurrent limit has been reached.
   * @param {Object} message - The message payload.
   * @param {string} message.name - The command or action name.
   * @param {Object|string} [message.contentBody] - The body content of the message.
   * @param {Object} [options={ encrypt: true }] - Transmission configuration.
   * @param {boolean} [options.encrypt=true] - Whether to send the buffer encrypted.
   * @returns {Promise<ResponseMessage>} The resolved response from the server.
   */
  async send(message, options = { encrypt: true }) {
    return new Promise((resolve) => {
      const executeSend = () => {
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

        this.requestCache[this.transmitMessageIndex] = {
          resolve,
          requestMessage,
          encrypted: options.encrypt
        };
      };

      if (this.messagesInAir < this.maxMessagesInAir) {
        executeSend();
      } else {
        this.messageQueue.push(executeSend);
      }
    });
  }

  /**
   * Appends incoming data to the receive buffer and triggers processing.
   * @private
   * @param {Buffer} data - The raw TCP chunk received from the socket.
   * @returns {void}
   */
  #handlePacket(data) {
    this.receiveBuffer = Buffer.concat([this.receiveBuffer, data]);
    this.#processBuffer();
  }

  /**
   * Processes the buffer, extracting messages as soon as their full content length is received.
   * @private
   * @returns {void}
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

      this.#handleMessageInternal(responseMessage);
      this.messagesInAir -= 1;

      if (cachedRequest) {
        cachedRequest.resolve(responseMessage);
        delete this.requestCache[id];
      }

      // Check if the queue has pending messages and process them
      this.#processQueue();
    }
  }

  /**
   * Dispatches pending messages from the queue if there is available capacity.
   * @private
   * @returns {void}
   */
  #processQueue() {
    while (this.messageQueue.length > 0 && this.messagesInAir < this.maxMessagesInAir) {
      const nextSend = this.messageQueue.shift();
      nextSend();
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
}

module.exports = RCONConnection;