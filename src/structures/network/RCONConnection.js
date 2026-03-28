const net = require("node:net");
const { EventEmitter } = require("node:events");
const ResponseMessage = require("./ResponseMessage");
const RequestMessage = require("./RequestMessage");

/**
 * Represents a single RCON server connection.
 * @extends EventEmitter
 */
class RCONConnection extends EventEmitter {
  socket = new net.Socket();

  xorKey = null;
  authToken = null;

  // Auto-increment for every sent message to assign a unique ID for each request.
  transmitMessageIndex = 0;

  // These values are for the packet the server is actively responding with, if any
  currentMessageIndex = null;
  currentMessageContentLength = null;
  currentMessageHeaderBuffer = null;
  currentMessageContentBuffer = null;

  // Array of messages waiting to be sent
  messageQueue = [];
  // Key-value of active messages waiting for response
  requestCache = {};

  host;
  port;
  password;

  constructor({ client }) {
    super();

    this.client = client;

    // Define authentication parameters
    this.host = client.host;
    this.port = client.port;
    this.password = client.password;

    // Initialize socket listeners

    // Handle socket closure
    this.socket.on("close", (error) => {
      this.client.emit("socketClosed", error);

      if (error) {
        throw new Error("Socket closed due to transmission error.");
      } else {
        throw new Error("Socket closed.");
      }
    });

    // Socket is ready for communication
    this.socket.on("ready", async () => {
      this.client.emit("socketReady");

      // Send ServerConnect command to initialize V2 connection
      const serverConnectRequest = new RequestMessage(this, {
        name: "ServerConnect"
      });

      const serverConnectResponse = await this.send(serverConnectRequest, { encrypt: false });

      // Ensure the ServerConnect was successful
      const { statusCode, statusMessage } = serverConnectResponse;
      if (statusCode !== 200) {
        throw new Error(`Error running ServerConnect: ${statusMessage}`);
      }
    });

    // Bind data listener to private #handlePacket method
    this.socket.on("data", this.#handlePacket.bind(this));

    // Connect to socket
    this.socket.connect(this.port, this.host);
  }

  /**
   * Send a RequestMessage
   *
   * @param {RequestMessage} message
   * @param {Object} options
   * @returns {Promise<ResponseMessage>}
   */
  async send(message, options = { encrypt: true }) {
    const messageBuffer = options.encrypt ? message.toBuffer() : message.toUnencryptedBuffer();

    this.socket.write(messageBuffer);

    return new Promise((resolve) => {
      this.requestCache[this.transmitMessageIndex] = {
        resolve,
        requestMessage: message,
        encrypted: options.encrypt
      };
    });
  }

  /**
   * @param {Buffer} data
   * @returns {Promise<void>}
   */
  #handlePacket(data) {
    // Initialize content buffer, content can only be determined once the existence (or nonexistence) of a header is determined.
    let contentBuffer;

    // Check if there is currently a message being received, if not, start a new one.
    if (!this.currentMessageHeaderBuffer) {
      const header = this.currentMessageHeaderBuffer = data.subarray(0, 12);

      const id = header.readUInt32LE(4);
      const contentLength = header.readUInt32LE(8);

      this.currentMessageIndex = id;
      this.currentMessageContentLength = contentLength;
      this.currentMessageContentBuffer = Buffer.alloc(0); // Initialize empty buffer

      // Actual content is all data after the header
      contentBuffer = data.subarray(12);
    } else {
      // The entire packet is the content for every subsequent packet of a response split into multiple packets
      contentBuffer = data;
    }

    // Append the new data to the current data buffer
    this.currentMessageContentBuffer = Buffer.concat([this.currentMessageContentBuffer, contentBuffer]);

    // Check if the receive buffer is full, if it is, process the buffer
    if (this.currentMessageContentBuffer.length === this.currentMessageContentLength) {
      this.#processBuffer();
    }
  }

  // Processes the buffer once all content for a message has been received
  #processBuffer() {
    // Get cached request
    const cachedRequest = this.requestCache[this.currentMessageIndex];
    const rawBuffer = Buffer.concat([this.currentMessageHeaderBuffer, this.currentMessageContentBuffer]);

    const { resolve } = cachedRequest;

    // Reset all buffer related states for the next message
    this.currentMessageHeaderBuffer = null;
    this.currentMessageContentBuffer = null;
    this.currentMessageContentLength = null;
    this.currentMessageIndex = null;

    // Generate ResponseMessage
    const responseMessage = new ResponseMessage(rawBuffer, cachedRequest);

    // Call internal message handler
    this.#handleMessageInternal(responseMessage);

    // Resolve cached request with the ResponseMessage
    resolve(responseMessage);
  }

  /**
   * // Internal message parser, for receiving ServerConnect and other internal library functions
   *
   * @param {ResponseMessage} responseMessage
   */
  async #handleMessageInternal(responseMessage) {
    switch (responseMessage.name) {

      // Store XOR key and attempt to authenticate with the server
      case "ServerConnect": {
        const xorKeyB64 = responseMessage.contentBody;
        this.xorKey = Buffer.from(xorKeyB64, "base64");

        const loginRequest = new RequestMessage(this, {
          name: "Login",
          contentBody: this.password
        });

        await this.send(loginRequest);

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

        break;
      }
    }
  }
}

module.exports = RCONConnection;